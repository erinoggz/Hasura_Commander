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
        return
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
          webhook: trigger.trigger.webhook,
          insert: { columns: "*" },
          update: { columns: "*" },
        },
      };

     if (trigger.trigger.headers && trigger.trigger.headers.length > 0) {
        eventTriggerQuery.args.headers = trigger.trigger.headers.map((head: any) =>
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
      console.log(`Created event trigger "${trigger.trigger.name}"`);
    }
  }
