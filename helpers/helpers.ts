/** @format */

import fs from "fs";
import YAML from "js-yaml";
import axios from "axios";
import { SchemaConfig } from "../common/IMetadata";

export const loadYamlMetadata = (filePath: string): SchemaConfig => {
  const raw = fs.readFileSync(filePath, "utf8");
  return YAML.load(raw) as SchemaConfig;
};

export async function makeHasuraRequest(
  hasuraUrl: string,
  hasuraAdminSecret: string,
  endpoint: string,
  query: any
) {
  try {
    const response = await axios.post(`${hasuraUrl}${endpoint}`, query, {
      headers: {
        "Content-Type": "application/json",
        "X-Hasura-Admin-Secret": hasuraAdminSecret,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `Hasura request to ${endpoint} failed:`,
        error.response.status,
        error.response.data
      );
    } else {
      console.error(`Hasura request error:`, error.message);
    }
    throw error;
  }
}