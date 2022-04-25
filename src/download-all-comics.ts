import path from "path";
import rimraf from "rimraf";
import downloadComic from "./download-comic";
import { extractZip } from "./utils/archive";
import type { GetComicsOptions, ComicLink } from "./types";

async function downloadAllComics(
  links: ComicLink[],
  options: GetComicsOptions
) {
  for (let i = 0; i < links.length; i += 1) {
    const {
      links: { main, mirror, mega, mediafire, zippyshare },
    } = links[i];

    let success = false;

    let fileName = "";

    if (!success && zippyshare) {
      try {
        console.log("\nAttempting download from ZippyShare");
        fileName = await downloadComic(zippyshare, options);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    if (!success && mediafire) {
      try {
        console.log("\nAttempting download from MediaFire");
        fileName = await downloadComic(mediafire, options);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    if (!success && mega) {
      try {
        console.log("\nAttempting download from mega.nz");
        fileName = await downloadComic(mega, options);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from Mega.nz:\n",
          (err as Error).message
        );
      }
    }

    if (!success && main) {
      try {
        console.log("\nAttempting download from GetComics' main servers");
        fileName = await downloadComic(main, options);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    if (!success && mirror) {
      try {
        console.log("\nAttempting download from GetComics' mirror servers");
        fileName = await downloadComic(mirror, options);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    // Extract any downloaded .zip files
    if (!options.noExtract && fileName && /\.zip$/i.test(fileName)) {
      try {
        console.log(
          "The comics for this download are in a .zip archive, attempting to extract"
        );
        const filePath = path.join(options.output, fileName);
        await extractZip(filePath, options.output);

        console.log("Finished extracting archive, deleting .zip file");
        rimraf.sync(filePath, { glob: false });
      } catch (err) {
        console.error("Error extracting zip archive:");
        console.error((err as Error).message);
      }
    }
  }
}

export default downloadAllComics;
