import { URL } from "url";
import fetch from "node-fetch";

export async function getUsersCloudLink(url: string) {
  const { pathname } = new URL(url);

  const pathArr = pathname.split("/").filter(Boolean);

  const [id] = pathArr;

  const body = new URLSearchParams({
    op: "download2",
    id,
  });

  const res = await fetch("https://userscloud.com/x8u2u9htpg8x", {
    method: "POST",
    body,
    headers: {
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
    },
  });

  const redirectUrl = res.url;

  return redirectUrl;
}
