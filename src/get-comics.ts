import chalk from "chalk";
import mkdirp from "mkdirp";
import downloadAllComics from "./download-all-comics";
import { parseAllLinks, writeLinksFile } from "./parse-links";
import logOptions from "./utils/log-options";
import type { ComicLink, GetComicsOptions } from "./types";

const DEFAULT_OPTIONS: GetComicsOptions = {
  pages: 1,
  start: 1,
  output: process.cwd(),
};

const asciiTitle = chalk.cyan(`
  ╔═╗╔═╗╔╦╗  ╔═╗╔═╗╔╦╗╦╔═╗╔═╗
  ║ ╦║╣  ║───║  ║ ║║║║║║  ╚═╗
  ╚═╝╚═╝ ╩   ╚═╝╚═╝╩ ╩╩╚═╝╚═╝
`);

async function getComics(opts: Partial<GetComicsOptions>) {
  console.log(asciiTitle);

  const options: GetComicsOptions = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  logOptions(options);

  let links: ComicLink[] = [];
  try {
    links = await parseAllLinks(options);
  } catch (err) {
    console.error(chalk.red("Error parsing comic links:"));
    console.error("  ", chalk.red((err as Error).message));

    return;
  }

  console.log(
    `\nFinished parsing all links,`,
    links.length,
    `comic downloads found`
  );

  if (!links.length) {
    console.log("\nNo comics found, exiting");
    return;
  }

  await mkdirp(options.output);

  if (options.saveLinks) {
    await writeLinksFile(links, options);
  }

  await downloadAllComics(links, options);

  console.log("\nFinished downloading all comics!");
}

export default getComics;
