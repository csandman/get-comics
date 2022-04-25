import mkdirp from "mkdirp";
import downloadAllComics from "./download-all-comics";
import { parseAllLinks, writeLinksFile } from "./parse-links";
import type { GetComicsOptions } from "./types";

const DEFAULT_OPTIONS: GetComicsOptions = {
  pages: 1,
  start: 1,
  output: process.cwd(),
};

async function getComics(opts: Partial<GetComicsOptions>) {
  const options: GetComicsOptions = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  const links = await parseAllLinks(options);

  console.log(links);

  await mkdirp(options.output);

  if (options.saveLinks) {
    await writeLinksFile(links, options);
  }

  await downloadAllComics(links, options);

  console.log("\nFinished downloading all comics!");
}

export default getComics;
