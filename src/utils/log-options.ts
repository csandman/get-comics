import { Console } from "console";
import path from "path";
import { Transform } from "stream";
import type { GetComicsOptions } from "../types";

function getTable(input: Record<string, number | string>[]) {
  // @see https://stackoverflow.com/a/67859384
  const ts = new Transform({
    transform(chunk, enc, cb) {
      cb(null, chunk);
    },
  });
  const logger = new Console({ stdout: ts });
  logger.table(input);
  const table = (ts.read() || "").toString();
  let result = "";
  table.split(/[\r\n]+/).forEach((row: string) => {
    const r = row
      .replace(/[^┬]*┬/, "┌")
      .replace(/^├─*┼/, "├")
      .replace(/│[^│]*/, "")
      .replace(/^└─*┴/, "└")
      .replace(/'/g, " ");

    result += `${r}\n`;
  });

  return result;
}

function logOptions(options: GetComicsOptions) {
  console.log("Options Selected:");

  const opts = [
    {
      Option: "Output Path",
      Value: path.resolve(options.output),
    },
    {
      Option: "Total Pages",
      Value: options.pages <= 0 ? "∞" : options.pages,
    },
  ];

  const table = getTable(opts);

  console.log(table);
}

export default logOptions;
