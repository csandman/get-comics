import { createWriteStream } from "fs";
import { readdir } from "fs/promises";
import path from "path";
import archiver from "archiver";
import mkdirp from "mkdirp";
import { createExtractorFromFile } from "node-unrar-js";
import yauzl from "yauzl";
import type { Entry } from "yauzl";

export const extractZip = async (
  filePath: string,
  outputPath: string,
  shouldFlatten = false
) => {
  await mkdirp(outputPath);

  const filePaths: string[] = [];

  return new Promise<string[]>((resolve, reject) => {
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

            const outputFilePath = path.join(
              outputPath,
              shouldFlatten ? baseFileName : entry.fileName
            );
            const outputFileDir = path.parse(outputFilePath).dir;
            await mkdirp(outputFileDir);

            filePaths.push(outputFilePath);

            const fileStream = createWriteStream(outputFilePath);

            readStream.pipe(fileStream);
          });
        }
      });

      zipfile.on("end", () => {
        resolve(filePaths);
      });

      zipfile.on("error", (zipErr: Error) => {
        zipfile.close();
        reject(zipErr);
      });
    });
  });
};

export const extractLastImageFromZip = async (
  filePath: string,
  outputPath: string
): Promise<string> => {
  await mkdirp(outputPath);

  let lastImage: { fileName: string; entry: Entry } | null = null;

  return new Promise<string>((resolve, reject) => {
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
          const baseFileName = path.parse(entry.fileName).base;

          if (!lastImage) {
            lastImage = { fileName: baseFileName, entry };
          } else if (baseFileName.localeCompare(lastImage.fileName) > 0) {
            lastImage = { fileName: baseFileName, entry };
          }

          zipfile.readEntry();
        }
      });

      zipfile.on("end", () => {
        const { fileName: baseFileName, entry: lastImageEntry } =
          lastImage || {};
        if (!baseFileName || !lastImageEntry) {
          throw new Error("No images found in zip file");
        } else {
          zipfile.openReadStream(
            lastImageEntry,
            async (readErr, readStream) => {
              if (readErr) {
                throw readErr;
              }

              readStream.on("end", () => {
                zipfile.readEntry();
              });

              console.log("Extracting file:", baseFileName);

              const outputFilePath = path.join(outputPath, baseFileName);
              const outputFileDir = path.parse(outputFilePath).dir;
              await mkdirp(outputFileDir);

              const fileStream = createWriteStream(outputFilePath);

              fileStream.on("finish", () => {
                resolve(outputFilePath);
              });

              readStream.pipe(fileStream);
            }
          );
        }
      });

      zipfile.on("error", (zipErr: Error) => {
        zipfile.close();
        reject(zipErr);
      });
    });
  });
};

export const extractRar = async (filePath: string, outputPath: string) => {
  await mkdirp(outputPath);

  const extractor = await createExtractorFromFile({
    filepath: filePath,
    targetPath: outputPath,
  });

  const extracted = extractor.extract();

  const files = [...extracted.files].map((file) => file.fileHeader.name); // load the files

  console.log(files.length, "files extracted from comic book archive");

  return files;
};

export const createArchive = async (
  sourceDir: string,
  outputFilePath: string
) => {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = createWriteStream(outputFilePath);

  const filesToZip = await readdir(sourceDir, { withFileTypes: true });

  return new Promise<void>((resolve, reject) => {
    filesToZip.forEach((file) => {
      const filePath = path.join(sourceDir, file.name);

      if (file.isDirectory()) {
        archive.directory(filePath, file.name);
      } else {
        archive.file(filePath, { name: file.name });
      }
    });

    archive.on("error", (err) => reject(err)).pipe(stream);

    stream.on("close", () => resolve());

    archive.finalize();
  });
};
