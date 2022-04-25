import { createWriteStream, existsSync } from "fs";
import path from "path";
import { File } from "megajs";
import fetch from "node-fetch";
import { extract as getZippyshareLink } from "zs-extract";
import getProgressBar from "./get-progress-bar";
import { getMediafireLink } from "./mediafire";
import { checkIsHost, getFilenameFromContentDisposition } from "./requests";

// const MAIN_SERVER_HOST = "comicfiles.ru";
const ZIPPYSHARE_HOST = "zippyshare.com";
const MEDIAFIRE_HOST = "mediafire.com";
const MEGA_HOST = "mega.nz";

async function getDownloadParts(downloadUrl: string) {
  let fileName: string;
  let fileSize: number;
  let downloadStream: NodeJS.ReadableStream;

  if (checkIsHost(downloadUrl, MEGA_HOST)) {
    const megaFile = File.fromURL(downloadUrl);

    const fileAttributes = await megaFile.loadAttributes();

    fileName = fileAttributes.name as string;
    fileSize = fileAttributes.size as number;
    downloadStream = megaFile.download({});
  } else {
    let realDownloadUrl: string = downloadUrl;

    if (checkIsHost(downloadUrl, MEDIAFIRE_HOST)) {
      const mediafireUrl = await getMediafireLink(downloadUrl);
      if (!mediafireUrl) {
        throw new Error("No MediaFire download available");
      }
      realDownloadUrl = mediafireUrl;
    } else if (checkIsHost(downloadUrl, ZIPPYSHARE_HOST)) {
      const zippyUrl = await getZippyshareLink(downloadUrl);
      if (!zippyUrl?.download) {
        throw new Error("No ZippyShare download available");
      }
      realDownloadUrl = zippyUrl.download;
    }

    const res = await fetch(realDownloadUrl);

    downloadStream = res.body as NodeJS.ReadableStream;
    fileSize = Number(res.headers.get("content-length"));

    if (
      checkIsHost(downloadUrl, MEDIAFIRE_HOST) ||
      checkIsHost(downloadUrl, ZIPPYSHARE_HOST)
    ) {
      fileName = getFilenameFromContentDisposition(res);
    } else {
      fileName = decodeURIComponent(downloadUrl.split("/").pop() as string);
    }
  }

  return { fileName, fileSize, downloadStream };
}

async function downloadComic(comicUrl: string, outputPath: string) {
  const { fileName, fileSize, downloadStream } = await getDownloadParts(
    comicUrl
  );

  console.log("Downloading Comic:", fileName);

  const resSize = Number(fileSize);

  const outputFilePath = path.join(outputPath, fileName);
  if (existsSync(outputFilePath)) {
    console.log("Comic file already exists, skipping");
    return "";
  }

  const fileStream = createWriteStream(outputFilePath);

  const progressBar = getProgressBar(resSize);
  let totalBytes = 0;

  await new Promise<void>((resolve, reject) => {
    downloadStream.pipe(fileStream);
    downloadStream.on("error", reject);
    downloadStream.on("data", (chunk) => {
      totalBytes += chunk.length;
      progressBar.update(totalBytes);
    });
    fileStream.on("finish", () => {
      progressBar.stop();
      console.log("Finished downloading comic:", outputFilePath);
      resolve();
    });
  });

  return fileName;
}

export default downloadComic;
