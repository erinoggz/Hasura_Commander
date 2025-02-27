import { program } from "./utils/cli";
import { runAllActions } from "./utils/metadata";

program.action(async (options: { endpoint: string; secret: string; filePath: string; dump: boolean }) => {
  try {
    const { endpoint, secret, filePath } = options;
        // Check if the `-f` flag was passed
      if (!filePath) {
        console.error("Error: Metadata file path is required. Use the -f flag to specify the file.");
        process.exit(1);
      }
      await runAllActions(endpoint, secret, filePath);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
});

/* Handle invalid command. */
program.on("command:*", () => {
  console.error(`Invalid command: ${program.args.join(" ")}`);
  program.help();
  process.exit(1);
});

/*This allows us to process and extract data from the command line arguments passed to program.*/
program.parse(process.argv);
