import { writeFile } from "fs/promises";
import path from "path";
import { getDateTime } from "./utils/date";
import loadPage from "./utils/load-page";
import { getRedirectLocation } from "./utils/requests";
import { prefixHttps, urlExists } from "./utils/url";
import type { GetComicsOptions, ComicLink } from "./types";

export async function parseDownloadLinks(url: string, links: ComicLink[]) {
  console.log("Parsing download links from comic page at URL:", url);

  const page = await loadPage(url);

  const mainDownloadLink = page('a[title="Download Now"]').attr("href");

  if (mainDownloadLink) {
    const title = page("section.post-contents h2").text().trim();

    const mirror = page('a[title="Mirror Download"]').attr("href");
    const mega = page('a[title="MEGA"]').attr("href");
    const mediafire = page('a[title="MEDIAFIRE"]').attr("href");
    const zippyshare = page('a[title="ZIPPYSHARE"]').attr("href");
    const ufile = page('a[title="UFILE"]').attr("href");
    const dropapk = page('a[title="DropAPK"]').attr("href");

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
      },
    };

    links.push(newDownload);
  } else {
    console.log("Multi-comic page detected, parsing all links");

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

      page("a", li).each((ii, anchorSel) => {
        const anchor = page(anchorSel);

        const downloadUrl = anchor.attr("href") as string;
        const anchorText = anchor.text().toLowerCase().replace(/\s/g, "");

        if (anchorText === "mainserver" || anchorText === "link1") {
          main = downloadUrl;
        } else if (anchorText.includes("mirror") || anchorText === "link2") {
          mirror = downloadUrl;
        } else if (anchorText === "mega") {
          mega = downloadUrl;
        } else if (anchorText === "mediafire") {
          mediafire = downloadUrl;
        } else if (anchorText === "zippyshare") {
          zippyshare = downloadUrl;
        } else if (anchorText === "dropapk") {
          dropapk = downloadUrl;
        } else if (anchorText === "ufile") {
          ufile = downloadUrl;
        } else if (anchorText === "cloudmail") {
          cloudmail = downloadUrl;
        }
      });

      const hasDownloadLink =
        [
          main,
          mirror,
          mega,
          mediafire,
          zippyshare,
          dropapk,
          ufile,
          cloudmail,
        ].filter(Boolean).length > 0;

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
          },
        };

        links.push(newDownload);
      }
    });
  }
}

export async function parseWeekPage(url: string, links: ComicLink[]) {
  console.log("Parsing week page at URL:", url);

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

const BASE_URL = "https://getcomics.info";

export async function parseAllLinks(
  options: GetComicsOptions
): Promise<ComicLink[]> {
  const links: ComicLink[] = [];

  if (options.url) {
    const url = prefixHttps(options.url);

    if (!urlExists(url)) {
      throw new Error("The value passed for `url` is not a valid URL.");
    }

    if (!/https:\/\/getcomics\.info/.test(url)) {
      throw new Error(
        "The value passed for `url` is not a valid GetComics URL."
      );
    }

    await parseDownloadLinks(url, links);
  } else {
    let baseUrl = BASE_URL;
    if (options.tag) {
      baseUrl = `${baseUrl}/tag/${options.tag}`;
    } else if (options.category) {
      baseUrl = `${baseUrl}/cat/${options.category}`;
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
          ? `${baseUrl}${queryStr}`
          : `${baseUrl}/page/${currPage}${queryStr}`;
      hasNextPage = await parseIndexPage(indexUrl, links);
      currPage += 1;
    }
  }

  const fullRedirectedLinks = await Promise.all(
    links.map(
      async ({
        title,
        pageUrl,
        links: { main, mirror, mega, mediafire, zippyshare, dropapk, ufile },
      }) => ({
        title,
        pageUrl,
        links: {
          ...(main && { main: await getRedirectLocation(main) }),
          ...(mirror && { mirror: await getRedirectLocation(mirror) }),
          ...(mega && { mega: await getRedirectLocation(mega) }),
          ...(mediafire && { mediafire: await getRedirectLocation(mediafire) }),
          ...(zippyshare && {
            zippyshare: await getRedirectLocation(zippyshare),
          }),
          ...(dropapk && { dropapk: await getRedirectLocation(dropapk) }),
          ...(ufile && { ufile: await getRedirectLocation(ufile) }),
        },
      })
    )
  );

  return fullRedirectedLinks;
}

export async function writeLinksFile(
  links: ComicLink[],
  options: GetComicsOptions
) {
  const linkFileName = `links_${getDateTime()}.json`;
  const linkFilePath = path.join(options.output, linkFileName);
  await writeFile(linkFilePath, JSON.stringify(links, null, 2));
}