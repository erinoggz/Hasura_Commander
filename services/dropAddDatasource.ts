/** @format */

import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function dropDatabaseSource(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);
  const sourceName = metadata.sources[0].name;

  const dropSourceQuery = {
    type: "pg_drop_source",
    args: {
      name: metadata.sources[0].name,
      cascade: true,
    },
  };

  try {
    await makeHasuraRequest(
      hasuraUrl,
      hasuraAdminSecret,
      "/v1/metadata",
      dropSourceQuery
    );
    console.log(`Database source "${sourceName}" dropped successfully`);
  } catch (err: any) {
    if (err?.response?.data?.code === "not-exists") {
      console.warn(`Source "${sourceName}" does not exist. Skipping drop.`);
      return;
    }
    throw err;
  }
}

export async function addDatabaseSource(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);
  if (!metadata?.sources || metadata?.sources?.length <= 0) {
    return;
  }

  const sourceName = metadata.sources[0].name;
  const addSourceQuery = {
    type: "pg_add_source",
    args: {
      name: sourceName,
      configuration: {
        connection_info: {
          database_url: {
            from_env: metadata.environmet,
          },
        },
      },
    },
  };

  await makeHasuraRequest(
    hasuraUrl,
    hasuraAdminSecret,
    "/v1/metadata",
    addSourceQuery
  );
  console.log(`Database source "${sourceName}" added successfully`);
}
