import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import yauzl from "yauzl";
import type { Entry } from "yauzl";

export const extractZip = async (filePath: string, outputPath: string) => {
  await mkdirp(outputPath);

  return new Promise<void>((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (openErr, zipfile) => {
      if (openErr) {
        reject(openErr);
      }

      zipfile.readEntry();

      zipfile.on("entry", (entry: Entry) => {
        if (/\/$/.test(entry.fileName)) {
          // Directory file names end with '/'.
          // Note that entires for directories themselves are optional.
          // An entry's fileName implicitly requires its parent directories to exist.
          zipfile.readEntry();
        } else {
          zipfile.openReadStream(entry, async (readErr, readStream) => {
            if (readErr) {
              throw readErr;
            }

            readStream.on("end", () => {
              zipfile.readEntry();
            });

            const baseFileName = path.parse(entry.fileName).base;

            console.log("Extracting file:", baseFileName);

            const outputFilePath = path.join(outputPath, baseFileName);

            const fileStream = fs.createWriteStream(outputFilePath);

            readStream.pipe(fileStream);
          });
        }
      });

      zipfile.on("end", () => {
        resolve();
      });

      zipfile.on("error", (zipErr: Error) => {
        zipfile.close();
        reject(zipErr);
      });
    });
  });
};
