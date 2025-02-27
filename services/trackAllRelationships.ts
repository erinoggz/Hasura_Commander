/** @format */

import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function trackAllRelationships(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);
  const sourceName = metadata.sources[0].name;

  // Fetch tracked tables
  const tablesResponse = await makeHasuraRequest(
    hasuraUrl,
    hasuraAdminSecret,
    "/v1/metadata",
    {
      type: "export_metadata",
      args: {},
    }
  );

  const tables =
    tablesResponse.sources
      .find((s: any) => s.name === sourceName)
      ?.tables.map((t: any) => t.table.name) || [];

  if (tables.length === 0) {
    console.log("No tables found to track relationships.");
    return;
  }

  // Fetch foreign key constraints
  const fkQuery = `
      SELECT
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confrelid::regclass AS referenced_table,
        af.attname AS referenced_column
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE c.contype = 'f';
    `;

  const fkResponse = await makeHasuraRequest(
    hasuraUrl,
    hasuraAdminSecret,
    "/v2/query",
    {
      type: "run_sql",
      args: { source: sourceName, sql: fkQuery },
    }
  );

  // Ignore column headers
  const relationships = fkResponse.result.slice(1);

  for (const [table, column, refTable] of relationships) {
    if (!tables.includes(table) || !tables.includes(refTable)) continue;

    // Track object relationship
    await makeHasuraRequest(hasuraUrl, hasuraAdminSecret, "/v1/metadata", {
      type: "pg_create_object_relationship",
      args: {
        source: sourceName,
        table: { schema: metadata.schema, name: table },
        name: `${refTable}_by_${column}`,
        using: { foreign_key_constraint_on: column },
      },
    });
    console.log(`Object relationship tracked: ${table} -> ${refTable}`);

    // Track array relationship
    await makeHasuraRequest(hasuraUrl, hasuraAdminSecret, "/v1/metadata", {
      type: "pg_create_array_relationship",
      args: {
        source: sourceName,
        table: { schema: "public", name: refTable },
        name: table,
        using: {
          foreign_key_constraint_on: {
            table: { schema: "public", name: table },
            column,
          },
        },
      },
    });
    console.log(`Array relationship tracked: ${refTable} -> ${table}`);
  }
}
