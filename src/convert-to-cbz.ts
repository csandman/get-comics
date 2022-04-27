import path from "path";
import { nanoid } from "nanoid";
import rimraf from "rimraf";
import { createArchive, extractRar } from "./utils/archive";

async function convertToCbz(filePath: string) {
  const fileDir = path.parse(filePath).dir;

  const tempDirName = `.temp-${nanoid()}`;
  const tempDirPath = path.join(fileDir, tempDirName);

  try {
    console.log("Extracting CBR file:", filePath);
    await extractRar(filePath, tempDirPath);

    const newFilePath = filePath.replace(/\.cbr$/, ".cbz");

    console.log("Creating new archive:", newFilePath);
    await createArchive(tempDirPath, newFilePath);

    console.log("New archive created, deleting original CBR file");
    rimraf.sync(filePath, { glob: false });
    rimraf.sync(tempDirPath, { glob: false });
  } catch (err) {
    console.error("Error converting to CBZ:");
    console.error((err as Error).message);
    rimraf.sync(tempDirPath, { glob: false });
  }
}

export default convertToCbz;
