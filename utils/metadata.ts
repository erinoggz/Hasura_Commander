/** @format */

import { trackAllRelationships } from "../services/trackAllRelationships";
import { setPermissions } from "../services/setPermissions";
import { addDatabaseSource, dropDatabaseSource } from "../services/dropAddDatasource";
import { trackAllTables } from "../services/trackAllTables";
import { createEventTriggers } from "../services/createEventTrigger";

export async function runAllActions(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string,
) {
  try {
    await dropDatabaseSource(hasuraUrl, hasuraAdminSecret, filePath);
    await addDatabaseSource(hasuraUrl, hasuraAdminSecret, filePath);
    await trackAllTables(hasuraUrl, hasuraAdminSecret, filePath);
    await trackAllRelationships(hasuraUrl, hasuraAdminSecret, filePath);
    await setPermissions(hasuraUrl, hasuraAdminSecret, filePath);
    await createEventTriggers(hasuraUrl, hasuraAdminSecret, filePath);
  } catch (error) {
    console.error("Error running actions:", error.message);
  }
}
