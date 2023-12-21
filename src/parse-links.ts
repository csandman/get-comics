import { writeFile } from "fs/promises";
import path from "path";
import chalk from "chalk";
import any from "./utils/any";
import { getDateTime } from "./utils/date";
import loadPage from "./utils/load-page";
import { getRedirectLocation } from "./utils/requests";
import { prefixHttps, urlExists } from "./utils/url";
import type { GetComicsOptions, ComicLink } from "./types";
import type { CheerioAPI } from "cheerio";

/**
 * Parse a comic page that only has a single comic to download
 *
 * @see {@link https://getcomics.org/dc/dark-knights-of-steel-6-2022/}
 *
 * @param page - The cheerio page to parse
 * @param url - The comic page's URL
 * @param links - A list of the final links to download
 */
export function parseSingleComicPage(
  page: CheerioAPI,
  url: string,
  links: ComicLink[]
) {
  const mainDownloadLink = page('a[title="Download Now"]').attr("href");

  const title = page("h1").first().text().trim();

  const mirror = page('a[title*="Mirror Download" i]').attr("href");
  const mega = page('a[title*="MEGA" i]').attr("href");
  const mediafire = page('a[title*="MEDIAFIRE" i]').attr("href");
  const zippyshare = page('a[title*="ZIPPYSHARE" i]').attr("href");
  const ufile = page('a[title*="UFILE" i]').attr("href");
  const dropapk = page('a[title*="DropAPK" i]').attr("href");
  const cloudmail = page('a[title*="CloudMail" i]').attr("href");
  const userscloud = page('a[title*="Userscloud" i]').attr("href");

  const newDownload: ComicLink = {
    title,
    pageUrl: url,
    links: {
      main: mainDownloadLink,
      ...(mirror && { mirror }),
      ...(mega && { mega }),
      ...(mediafire && { mediafire }),
      ...(zippyshare && { zippyshare }),
      ...(dropapk && { dropapk }),
      ...(ufile && { ufile }),
      ...(cloudmail && { cloudmail }),
      ...(userscloud && { userscloud }),
    },
  };

  links.push(newDownload);
}

/**
 * Parse a comic page with multiple comics to download
 *
 * @see {@link https://getcomics.org/other-comics/the-walking-dead-vol-1-24-tpb-extras-ultimate-collection/ }
 *
 * @param page - The cheerio page to parse
 * @param url - The comic page's URL
 * @param links - A list of the final links to download
 */
export function parseMultiComicPage(
  page: CheerioAPI,
  url: string,
  links: ComicLink[]
) {
  console.log("      Multi-comic page detected, parsing all links");

  page("section.post-contents li").each((i, liSel) => {
    const li = page(liSel);

    const title = li
      .first()
      .contents()
      .filter((ii, node) => node.type === "text")
      .text()
      .trim();

    let main = "";
    let mirror = "";
    let mega = "";
    let mediafire = "";
    let zippyshare = "";
    let dropapk = "";
    let ufile = "";
    let cloudmail = "";
    let userscloud = "";

    page("a", li).each((ii, anchorSel) => {
      const anchor = page(anchorSel);

      const downloadUrl = anchor.attr("href") as string;
      const anchorText = anchor.text().toLowerCase().replace(/\s/g, "");

      if (anchorText.includes("mainserver") || anchorText.includes("link1")) {
        main = downloadUrl;
      } else if (
        anchorText.includes("mirror") ||
        anchorText.includes("link2")
      ) {
        mirror = downloadUrl;
      } else if (anchorText.includes("mega")) {
        mega = downloadUrl;
      } else if (anchorText.includes("mediafire")) {
        mediafire = downloadUrl;
      } else if (anchorText.includes("zippyshare")) {
        zippyshare = downloadUrl;
      } else if (anchorText.includes("dropapk")) {
        dropapk = downloadUrl;
      } else if (anchorText.includes("ufile")) {
        ufile = downloadUrl;
      } else if (anchorText.includes("cloudmail")) {
        cloudmail = downloadUrl;
      } else if (anchorText.includes("userscloud")) {
        userscloud = downloadUrl;
      }
    });

    const hasDownloadLink = any(
      main,
      mirror,
      mega,
      mediafire,
      zippyshare,
      dropapk,
      ufile,
      cloudmail,
      userscloud
    );

    if (hasDownloadLink) {
      const newDownload: ComicLink = {
        title,
        pageUrl: url,
        links: {
          ...(main && { main }),
          ...(mirror && { mirror }),
          ...(mega && { mega }),
          ...(mediafire && { mediafire }),
          ...(zippyshare && { zippyshare }),
          ...(dropapk && { dropapk }),
          ...(ufile && { ufile }),
          ...(cloudmail && { cloudmail }),
          ...(userscloud && { userscloud }),
        },
      };

      links.push(newDownload);
    }
  });
}

/**
 * Parse a comic page that is formatted the same as a page with a single comic
 * download but actually has multiple
 *
 * @see {@link https://getcomics.org/other-comics/uncle-scrooge-1-404-complete/}
 *
 * @param page - The cheerio page to parse
 * @param url - The comic page's URL
 * @param links - A list of the final links to download
 */
export function parseMultiSingleComicPage(
  page: CheerioAPI,
  url: string,
  links: ComicLink[]
) {
  console.log("      Multi-comic page detected, parsing all links");

  page("p:empty").remove();

  const mainDownloadAnchors = page('a[title="Download Now"]');

  mainDownloadAnchors.each((_, anchorEl) => {
    const anchor = page(anchorEl);

    const main = anchor.attr("href");

    let buttonContainer = anchor.parent().parent();

    const titleContainer = buttonContainer.prev("p");
    const title = page("strong", titleContainer).first().text();

    const comicLink: ComicLink = {
      title,
      pageUrl: url,
      links: {
        main,
      },
    };

    let nextElementIsButton = true;

    while (nextElementIsButton) {
      buttonContainer = buttonContainer.next();
      const className = buttonContainer.attr("class");
      if (className === "aio-button-center") {
        const linkEl = page("a", buttonContainer);

        const downloadUrl = linkEl.attr("href") as string;
        const linkTitle = (linkEl.attr("title") || "")
          .toLowerCase()
          .replace(/\s/g, "");

        if (linkTitle.includes("mirror") || linkTitle.includes("link2")) {
          comicLink.links.mirror = downloadUrl;
        } else if (linkTitle.includes("mega")) {
          comicLink.links.mega = downloadUrl;
        } else if (linkTitle.includes("mediafire")) {
          comicLink.links.mediafire = downloadUrl;
        } else if (linkTitle.includes("zippyshare")) {
          comicLink.links.zippyshare = downloadUrl;
        } else if (linkTitle.includes("dropapk")) {
          comicLink.links.dropapk = downloadUrl;
        } else if (linkTitle.includes("ufile")) {
          comicLink.links.ufile = downloadUrl;
        } else if (linkTitle.includes("cloudmail")) {
          comicLink.links.cloudmail = downloadUrl;
        } else if (linkTitle.includes("userscloud")) {
          comicLink.links.userscloud = downloadUrl;
        }
      } else {
        nextElementIsButton = false;
      }
    }

    links.push(comicLink);
  });
}

export async function parseDownloadLinks(url: string, links: ComicLink[]) {
  console.log("    Parsing download links from comic page at URL:", url);

  const page = await loadPage(url);

  // TODO: This part assumes that all single comic download pages have a main server download link which might not always be true
  const mainDownloadAnchors = page('a[title="Download Now"]');
  const mainDownloadLink = mainDownloadAnchors.attr("href");

  // This will be true when the page is structured to have only one comic to download
  if (mainDownloadLink) {
    if (mainDownloadAnchors.length > 1) {
      parseMultiSingleComicPage(page, url, links);
    } else {
      parseSingleComicPage(page, url, links);
    }
  } else {
    parseMultiComicPage(page, url, links);
  }
}

export async function parseWeekPage(url: string, links: ComicLink[]) {
  console.log("  Parsing week page at URL:", url);

  const page = await loadPage(url);

  const comicPageUrls: string[] = [];
  page('a[rel="noopener noreferrer"]').each((i, anchorSel) => {
    const anchor = page(anchorSel);
    comicPageUrls.push(anchor.attr("href") as string);
  });

  for (let i = 0; i < comicPageUrls.length; i += 1) {
    await parseDownloadLinks(comicPageUrls[i], links);
  }
}

export async function parseIndexPage(url: string, links: ComicLink[]) {
  console.log("Parsing index page at URL:", url);

  const page = await loadPage(url);

  const comicPageUrls: string[] = [];

  page("h1.post-title a").each((i, comicPageLinkSel) => {
    const comicPageLink = page(comicPageLinkSel);
    comicPageUrls.push(comicPageLink.attr("href") as string);
  });

  for (let i = 0; i < comicPageUrls.length; i += 1) {
    const comicPageUrl = comicPageUrls[i];

    if (comicPageUrl.includes("week")) {
      await parseWeekPage(comicPageUrl, links);
    } else {
      await parseDownloadLinks(comicPageUrl, links);
    }
  }

  const hasNextPage = !!page("a.pagination-older").text();
  if (!hasNextPage) {
    console.log("No more pages left, stopping");
  }
  return hasNextPage;
}

function getRedirectedLinks(
  links: ComicLink[],
  baseUrl: string
): Promise<ComicLink[]> {
  return Promise.all(
    links.map(
      async ({
        title,
        pageUrl,
        links: {
          main,
          mirror,
          mega,
          mediafire,
          zippyshare,
          dropapk,
          ufile,
          cloudmail,
          userscloud,
        },
      }) => ({
        title,
        pageUrl,
        links: {
          ...(main && {
            main: await getRedirectLocation(main, baseUrl),
          }),
          ...(mirror && {
            mirror: await getRedirectLocation(mirror, baseUrl),
          }),
          ...(mega && {
            mega: await getRedirectLocation(mega, baseUrl),
          }),
          ...(mediafire && {
            mediafire: await getRedirectLocation(mediafire, baseUrl),
          }),
          ...(zippyshare && {
            zippyshare: await getRedirectLocation(zippyshare, baseUrl),
          }),
          ...(dropapk && {
            dropapk: await getRedirectLocation(dropapk, baseUrl),
          }),
          ...(ufile && {
            ufile: await getRedirectLocation(ufile, baseUrl),
          }),
          ...(cloudmail && {
            cloudmail: await getRedirectLocation(cloudmail, baseUrl),
          }),
          ...(userscloud && {
            userscloud: await getRedirectLocation(userscloud, baseUrl),
          }),
        },
      })
    )
  );
}

export async function parseAllLinks(
  options: GetComicsOptions
): Promise<ComicLink[]> {
  console.log(
    "\n------------------------------------------------------------------------------\n\n",
    chalk.bold("Finding All Download Links"),
    "\n\n------------------------------------------------------------------------------\n"
  );

  const { baseUrl } = options;

  const links: ComicLink[] = [];

  if (options.url) {
    const url = prefixHttps(options.url);

    if (!(await urlExists(url))) {
      throw new Error(
        `The value "${options.url}" passed for 'url' is not a valid URL.`
      );
    }

    if (!url.includes(baseUrl)) {
      throw new Error(
        `The value "${options.url}" passed for 'url' is not a valid GetComics URL.`
      );
    }

    await parseDownloadLinks(url, links);
  } else {
    let searchUrl = baseUrl;

    if (options.tag) {
      searchUrl = `${searchUrl}/tag/${options.tag}`;
    } else if (options.category) {
      searchUrl = `${searchUrl}/cat/${options.category}`;
    }

    let queryStr = "";
    if (options.query) {
      queryStr = `?s=${encodeURIComponent(options.query)}`;
    }

    let currPage = options.start;
    let hasNextPage = true;

    while (
      hasNextPage &&
      (currPage <= options.pages + options.start - 1 || options.pages <= 0)
    ) {
      const indexUrl =
        currPage === 0
          ? `${searchUrl}${queryStr}`
          : `${searchUrl}/page/${currPage}${queryStr}`;
      hasNextPage = await parseIndexPage(indexUrl, links);
      currPage += 1;
    }
  }

  const fullRedirectedLinks = await getRedirectedLinks(links, options.baseUrl);

  return fullRedirectedLinks;
}

export async function writeLinksFile(
  links: ComicLink[],
  options: GetComicsOptions
) {
  const linkFileName = `links_${getDateTime()}.json`;
  const linkFilePath = path.join(options.output, linkFileName);
  console.log(`\nWriting links to file at ${linkFilePath}`);
  await writeFile(linkFilePath, JSON.stringify(links, null, 2));
}
