/** @format */

import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function trackAllViews(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string,
) {
  const metadata = loadYamlMetadata(filePath);

  // Check if views are defined in metadata
  if (!metadata.views || metadata.views.length === 0) {
    console.log("No views to track");
    return;
  }

  for (const view of metadata.views) {
    const trackViewQuery = {
      type: "pg_track_table",
      args: {
        source: metadata.sources[0].name,
        table: {
          schema: metadata.schema,
          name: view,
        },
      },
    };

    await makeHasuraRequest(
      hasuraUrl,
      hasuraAdminSecret,
      "/v1/metadata",
      trackViewQuery,
    );
    console.log(`View "${view}" tracked successfully`);
  }
}
