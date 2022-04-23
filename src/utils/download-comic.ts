import { createWriteStream, existsSync } from "fs";
import path from "path";
import { URL } from "url";
import { File } from "megajs";
import fetch from "node-fetch";
import { extract as getZippyshareLink } from "zs-extract";
import getProgressBar from "./get-progress-bar";
import { getMediafireLink } from "./mediafire";
import type { Response } from "node-fetch";

export async function getRedirectLocation(url: string) {
  if (url.startsWith("https://getcomics.info/links.php")) {
    const redirectRes = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
    });
    const redirectUrl = redirectRes.headers.get("location");
    return redirectUrl || "";
  }

  return url;
}

function getFilenameFromContentDisposition(res: Response) {
  let filename = "";

  const disposition = res.headers.get("content-disposition") as string;

  if (disposition?.includes("attachment")) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches?.[1]) {
      filename = matches[1].replace(/['"]/g, "");
      filename = decodeURIComponent(filename);
      filename = filename.replace(/^UTF-8/i, "").trim();
    }
  }

  return filename;
}

// const MAIN_SERVER_HOST = "comicfiles.ru";
const ZIPPYSHARE_HOST = "zippyshare.com";
const MEDIAFIRE_HOST = "mediafire.com";
const MEGA_HOST = "mega.nz";

function checkIsHost(urlStr: string, host: string) {
  try {
    const url = new URL(urlStr);
    if (url.host.toLowerCase().includes(host)) {
      return true;
    }
  } catch (err) {
    console.warn("Error checking host:\n", (err as Error).message);
  }

  return false;
}

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
        throw new Error("No MediaFire link available");
      }
      realDownloadUrl = mediafireUrl;
    } else if (checkIsHost(downloadUrl, ZIPPYSHARE_HOST)) {
      const zippyUrl = await getZippyshareLink(downloadUrl);
      if (!zippyUrl?.download) {
        throw new Error("No ZippyShare link available");
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
  const downloadUrl = await getRedirectLocation(comicUrl);
  if (!downloadUrl) {
    throw new Error("No redirect url found");
  }

  const { fileName, fileSize, downloadStream } = await getDownloadParts(
    downloadUrl
  );

  console.log("Downloading Comic:", fileName);

  const resSize = Number(fileSize);

  const outputFilePath = path.join(outputPath, fileName);
  if (existsSync(outputFilePath)) {
    console.log("Comic file already exists, skipping");
    return;
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
}

export default downloadComic;
