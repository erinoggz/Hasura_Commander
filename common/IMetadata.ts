/** @format */

export type SchemaConfig = {
  version: number;
  schema: string;
  tables: string[];
  sources: Source[];
  roles: Role[];
  environmet: string;
  event_triggers: EventTrigger[];
};

type Source = {
  name: string;
  kind: string;
  tables: TablePermission[];
};

type TablePermission = {
  table: { schema: string; name: string };
  select_permissions?: Permission[];
  insert_permissions?: Permission[];
  update_permissions?: Permission[];
  delete_permissions?: Permission[];
};

type Permission = {
  role: string;
  permission: {
    columns: string | string[];
    filter?: Record<string, any>;
    allow_aggregations?: boolean;
    limit?: number;
    check?: Record<string, any>;
  };
};

type Role = {
  name: string;
  table_permissions: { table: string; permissions: Record<string, boolean> }[];
};

type EventTrigger = {
  trigger: {
    name: string;
    webhook: string;
    table_name: string;
    operations?: {
      insert?: { columns?: string[] };
      update?: { columns?: string[] };
      delete?: boolean;
    };
    headers?: {
      name: string;
      value?: string;
      value_from_env?: string;
    }[];
    enable_manual?: boolean;
    retry_conf?: {
      num_retries: number;
      interval_sec: number;
      timeout_sec: number;
    };
    replace?: boolean;
  };
};
