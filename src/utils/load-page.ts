import { load } from "cheerio";
import fetch from "node-fetch";
import type { CheerioAPI } from "cheerio";

async function loadPage(url: string): Promise<CheerioAPI> {
  const res = await fetch(url);
  const data = await res.text();
  const page = load(data);
  return page;
}

export default loadPage;
