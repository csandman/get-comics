import path from "path";
import chalk from "chalk";
import type { GetComicsOptions } from "../types";

function logFormattedRow(option: string, value: string | number | boolean) {
  const start = chalk.whiteBright(option).padEnd(30, " ");
  let end = chalk.yellowBright(value);

  const valueType = typeof value;
  if (valueType === "string" && value !== "∞") {
    end = chalk.blueBright(value);
  } else if (valueType === "boolean") {
    end = chalk.greenBright(value);
  }

  console.log(chalk.underline(`${start}${end}`));
}

function logOptions(options: GetComicsOptions) {
  console.log(chalk.cyanBright.bold.underline("Options Selected:\n"));

  logFormattedRow("Output Path", path.resolve(options.output));
  if (options.saveLinks) {
    logFormattedRow("Save Links File", true);
  }
  if (options.overwrite) {
    logFormattedRow("Overwrite Existing", true);
  }

  console.log("");

  logFormattedRow("Pages", options.pages <= 0 ? "∞" : options.pages);
  logFormattedRow("Start Page", options.start);

  if (
    [options.url, options.query, options.tag, options.category]
      .map(Boolean)
      .includes(true)
  ) {
    console.log("");

    if (options.url) {
      logFormattedRow("URL to Download", options.url);
    } else {
      if (options.query) {
        logFormattedRow("Search Query", options.query);
      }

      if (options.tag) {
        logFormattedRow("GetComics Tag", options.tag);
      } else if (options.category) {
        logFormattedRow("GetComics Category", options.category);
      }
    }
  }

  if (options.cbz || options.noExtract) {
    console.log("");

    if (options.cbz) {
      logFormattedRow("Convert to CBZ", true);
    }

    if (options.noExtract) {
      logFormattedRow("Don't Extract ZIPs", true);
    }
  }
}

export default logOptions;
