/** @format */

import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function trackAllTables(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);

  for (const table of metadata.tables) {
    const trackTableQuery = {
      type: "pg_track_table",
      args: {
        source: metadata.sources[0].name,
        table: {
          schema: metadata.schema,
          name: table,
        },
      },
    };

    await makeHasuraRequest(
      hasuraUrl,
      hasuraAdminSecret,
      "/v1/metadata",
      trackTableQuery
    );
    console.log(`Table "${table}" tracked successfully`);
  }
}
