/** @format */

import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function createEventTriggers(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);
  const sourceName = metadata.sources[0].name;

  if (!metadata?.event_triggers || metadata?.event_triggers?.length <= 0) {
    return;
  }

  for (const trigger of metadata.event_triggers) {
    const eventTriggerQuery = {
      type: "pg_create_event_trigger",
      args: {
        name: trigger.trigger.name,
        source: sourceName,
        table: {
          name: trigger.trigger.table_name,
          schema: metadata.schema,
        },
        webhook: trigger?.trigger?.webhook,
        insert: null,
        update: null,
        delete: null,
        headers: [],
        enable_manual: trigger.trigger.enable_manual || false,
        retry_conf: trigger?.trigger?.retry_conf || {
          num_retries: 5,
          interval_sec: 10,
          timeout_sec: 60,
        },
        replace: trigger?.trigger?.replace || false,
      },
    };

    const operations = trigger.trigger.operations || {};
    const operationTypes = [
      { key: "insert", hasColumns: true },
      { key: "update", hasColumns: true },
      { key: "delete", hasColumns: false },
    ];

    if (Object.keys(operations).length === 0) {
      // If no operations specified, default to insert, update and delete on all columns
      eventTriggerQuery.args.insert = { columns: "*" };
      eventTriggerQuery.args.update = { columns: "*" };
      eventTriggerQuery.args.delete = { columns: "*" };
    } else {
      operationTypes.forEach(({ key, hasColumns }) => {
        if (operations[key]) {
          eventTriggerQuery.args[key] = hasColumns
            ? { columns: operations[key]?.columns || "*" }
            : {};
        } else {
          eventTriggerQuery.args[key] = null;
        }
      });
    }

    if (trigger.trigger.headers && trigger.trigger.headers.length > 0) {
      eventTriggerQuery.args.headers = trigger.trigger.headers.map(
        (head: any) =>
          head.value_from_env
            ? { name: head.name, value_from_env: head.value_from_env }
            : { name: head.name, value: head.value }
      );
    }

    console.log(`Creating event trigger "${trigger.trigger.name}"`);
    await makeHasuraRequest(
      hasuraUrl,
      hasuraAdminSecret,
      "/v1/metadata",
      eventTriggerQuery
    );
    console.log(`Created event trigger "${trigger?.trigger.name}"`);
  }
}
