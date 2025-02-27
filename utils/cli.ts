import { Command } from "commander";
import figlet from "figlet";
import packageJson from '../package.json';

export const program = new Command();
const appVersion = packageJson.version;

console.log(figlet.textSync("Hasura Command Connect 🤠"));

/* This sets the name, version, and description for the CLI tool */

program
  .name("Hasura Connect")
  .version(appVersion, "-v, --version", "output the current version")
  .description("Hasura Connect is used to confirm Hasura connection.");

program
  .option("-e, --endpoint <url>", "Hasura endpoint URL")
  .option("-s, --secret <secret>", "Hasura admin secret")
  .option("-f, --filePath <filePath>", "Path to the metadata YAML file")
