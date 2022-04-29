import path from "path";
import chalk from "chalk";
import rimraf from "rimraf";
import convertToCbz from "./convert-to-cbz";
import downloadComic from "./download-comic";
import { extractZip } from "./utils/archive";
import {
  styledGetComics,
  styledMediaFire,
  styledMega,
  styledUsersCloud,
  styledZippyShare,
} from "./utils/styling";
import type { GetComicsOptions, ComicLink } from "./types";

async function downloadAllComics(
  links: ComicLink[],
  options: GetComicsOptions
) {
  console.log(
    "\n------------------------------------------------------------------------------\n\n",
    chalk.bold("Downloading All Comics")
  );

  for (let i = 0; i < links.length; i += 1) {
    const {
      title,
      links: { main, mirror, mega, mediafire, zippyshare, userscloud },
    } = links[i];

    console.log(
      "\n------------------------------------------------------------------------------\n\n",
      "Downloading Comic:",
      title
    );

    let success = false;

    let fileName = "";

    if (!success && zippyshare) {
      try {
        console.log(`\nAttempting download from ${styledZippyShare}`);
        fileName = await downloadComic(zippyshare, options);
        success = true;
      } catch (err) {
        console.error(
          `Error downloading from ${styledZippyShare}:\n`,
          (err as Error).message
        );
      }
    }

    if (!success && mediafire) {
      try {
        console.log(`\nAttempting download from ${styledMediaFire}`);
        fileName = await downloadComic(mediafire, options);
        success = true;
      } catch (err) {
        console.error(
          `Error downloading from ${styledMediaFire}:\n`,
          (err as Error).message
        );
      }
    }

    if (!success && main) {
      try {
        console.log(
          `\nAttempting download from ${styledGetComics}' main server`
        );
        fileName = await downloadComic(main, options);
        success = true;
      } catch (err) {
        console.error(
          `Error downloading from ${styledGetComics}:\n`,
          (err as Error).message
        );
      }
    }

    if (!success && mirror) {
      try {
        console.log(
          `\nAttempting download from ${styledGetComics}' mirror server`
        );
        fileName = await downloadComic(mirror, options);
        success = true;
      } catch (err) {
        console.error(
          `Error downloading from ${styledGetComics} mirror:\n`,
          (err as Error).message
        );
      }
    }

    if (!success && mega) {
      try {
        console.log(`\nAttempting download from ${styledMega}`);
        fileName = await downloadComic(mega, options);
        success = true;
      } catch (err) {
        console.error(
          `Error downloading from ${styledMega}:\n`,
          (err as Error).message
        );
      }
    }

    if (!success && userscloud) {
      try {
        console.log(`\nAttempting download from ${styledUsersCloud}`);
        fileName = await downloadComic(userscloud, options);
        success = true;
      } catch (err) {
        console.error(
          `Error downloading from ${styledUsersCloud}:\n`,
          (err as Error).message
        );
      }
    }

    if (fileName) {
      let filePaths: string[] = [path.join(options.output, fileName)];

      // Extract any downloaded .zip files
      // ex. https://getcomics.info/other-comics/wayward-1-22-tpb-vol-1-3-deluxe-books-2014-2017/
      if (!options.noExtract && /\.zip$/i.test(fileName)) {
        try {
          console.log(
            "\nThe comics for this download are in a .zip archive, attempting to extract"
          );
          const zipFilePath = path.join(options.output, fileName);
          filePaths = await extractZip(zipFilePath, options.output);

          console.log("Finished extracting archive, deleting .zip file");
          rimraf.sync(zipFilePath, { glob: false });
        } catch (err) {
          console.error("Error extracting zip archive:");
          console.error((err as Error).message);
        }
      }

      // Convert all comics in zip to CBZ
      if (options.cbz) {
        for (let j = 0; j < filePaths.length; j += 1) {
          const filePath = filePaths[j];

          if (/\.cbr$/i.test(filePath)) {
            console.log("\nConverting CBR comic file to CBZ");
            await convertToCbz(filePath);
          }
        }
      }
    } else {
      console.warn(
        "No downloads succeeded for comic:",
        chalk.bold.underline(title)
      );
    }
  }
}

export default downloadAllComics;
