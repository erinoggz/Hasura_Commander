import { loadYamlMetadata, makeHasuraRequest } from "../helpers/helpers";

export async function setPermissions(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  filePath: string
) {
  const metadata = loadYamlMetadata(filePath);
  const permissionQueries = metadata.sources.flatMap((source) => {
    if (!Array.isArray(source.tables) || source.tables.length === 0) {
      return [];
    }

    return source.tables.flatMap((table) => {
      const actions = [
        "select_permissions",
        "insert_permissions",
        "update_permissions",
        "delete_permissions",
      ];
      return actions.flatMap((action) => {
        const permissions = table[action];
        if (permissions) {
          return permissions.map((permission) => {
            console.log(
              `Setting ${action.replace("_permissions", "")} permission for role ${permission.role} on table ${JSON.stringify(table.table)}`
            );
            return {
              type: `create_${action.replace("_permissions", "")}_permission`,
              args: {
                source: source.name,
                table: table.table,
                role: permission.role,
                permission: permission.permission,
              },
            };
          });
        }
        return [];
      });
    });
  });

  // Process role table permissions
  const roleTablePermissionQueries = (metadata.roles || []).flatMap((role) => {
    const queries = [];
    const roleTablePermissions = role.table_permissions || [];
    for (const tablePerm of roleTablePermissions) {
      const actions = ["select", "insert", "update", "delete"];

      for (const action of actions) {
        if (tablePerm.permissions[action]) {
          console.log(
            `Setting ${action} permission for role '${role?.name}' on table '${tablePerm?.table}'`
          );
          queries.push({
            type: `create_${action}_permission`,
            args: {
              source: metadata.sources[0].name,
              table: { schema: "public", name: tablePerm.table },
              role: role.name,
              permission: {
                columns: "*",
                filter: {},
                check:
                  action === "insert" || action === "update" ? {} : undefined,
                allow_aggregations: action === "select" ? true : undefined,
              },
            },
          });
        }
      }
    }

    return queries;
  });

  const bulkQuery = {
    type: "bulk",
    args: [...permissionQueries, ...roleTablePermissionQueries],
  };

  await makeHasuraRequest(hasuraUrl, hasuraAdminSecret, "/v1/query", bulkQuery);
  console.log("Permissions applied successfully");
}