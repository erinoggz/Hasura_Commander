/** @format */

import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function trackCustomFunctions(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);

  // Check if custom functions are defined in metadata
  if (!metadata.custom_functions || metadata.custom_functions.length === 0) {
    console.log("No custom functions to track");
    return;
  }

  for (const func of metadata.custom_functions) {
    const trackFunctionQuery = {
      type: "pg_track_function",
      args: {
        source: metadata.sources[0].name,
        function: {
          schema: metadata.schema,
          name: func.name,
        },
        configuration: func.configuration || {},
      },
    };

    await makeHasuraRequest(
      hasuraUrl,
      hasuraAdminSecret,
      "/v1/metadata",
      trackFunctionQuery
    );
    console.log(`Function "${func.name}" tracked successfully`);
  }
}
