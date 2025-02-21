import { load } from "cheerio";
import puppeteer from "puppeteer";
import type { CheerioAPI } from "cheerio";

/** A standard user agent to get past the cloudflare bot detection */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

async function loadPage(url: string): Promise<CheerioAPI> {
  const puppeteerBrowser = await puppeteer.launch();

  const page = await puppeteerBrowser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.goto(url);
  const data = await page.evaluate(
    () => document.querySelector("*")?.outerHTML
  );
  await page.close();
  await puppeteerBrowser.close();

  if (!data) {
    const error = new Error(`Failed to load page at URL: ${url}`);
    console.error(error);
    throw error;
  }

  const cheerioPage = load(data);
  return cheerioPage;
}

export default loadPage;
