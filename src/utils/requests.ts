import { URL } from "url";
import fetch from "node-fetch";
import type { Response } from "node-fetch";

export async function getRedirectLocation(url: string, baseUrl: string) {
  if (url.startsWith(`${baseUrl}/links`)) {
    const redirectRes = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
    });
    const redirectUrl = redirectRes.headers.get("location");
    return redirectUrl || "";
  }

  if (url.includes("sh.st")) {
    const redirectRes = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "",
      },
    });

    const redirectUrl = redirectRes.url;

    return redirectUrl || "";
  }

  return url;
}

export function getFilenameFromContentDisposition(res: Response) {
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

export function checkIsHost(urlStr: string, host: string) {
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
