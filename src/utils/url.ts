import { URL } from "url";
import fetch from "node-fetch";

export function prefixHttps(url: string): string {
  return url.includes("://")
    ? `https://${url.split("://")[1].trim()}`
    : `https://${url.trim()}`;
}

export function isUrl(str: string): boolean {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }

  const trimmedStr = str.trim();

  if (trimmedStr.includes(" ")) {
    return false;
  }

  try {
    new URL(str); // eslint-disable-line no-new
    return true;
  } catch {
    return false;
  }
}

export async function urlExists(url: string): Promise<boolean> {
  if (typeof url !== "string") {
    throw new TypeError(`Expected a string, got ${typeof url}`);
  }

  if (!isUrl(url)) {
    return false;
  }

  try {
    const resp = await fetch(url, { method: "HEAD" });

    return resp.status !== 404;
  } catch (err) {
    return false;
  }
}
