import mkdirp from "mkdirp";
import downloadComic from "./utils/download-comic";
import loadPage from "./utils/load-page";

interface FullLink {
  title: string;
  links: {
    main?: string;
    mirror?: string;
    mega?: string;
    mediafire?: string;
    zippyshare?: string;
    ufile?: string;
    dropapk?: string;
  };
}

const fullLinks: FullLink[] = [];

async function parseDownloadLinks(url: string) {
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

    const newDownload: FullLink = {
      title,
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

    fullLinks.push(newDownload);
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

      page("a", li).each((ii, anchorSel) => {
        const anchor = page(anchorSel);

        const downloadUrl = anchor.attr("href") as string;
        const anchorText = anchor.text().trim().toLowerCase();

        if (anchorText === "main server") {
          main = downloadUrl;
        } else if (anchorText.includes("mirror")) {
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
        }
      });

      const hasDownloadLink =
        [main, mirror, mega, mediafire, zippyshare, dropapk, ufile].filter(
          Boolean
        ).length > 0;

      if (hasDownloadLink) {
        const newDownload = {
          title,
          links: {
            ...(main && { main }),
            ...(mirror && { mirror }),
            ...(mega && { mega }),
            ...(mediafire && { mediafire }),
            ...(zippyshare && { zippyshare }),
            ...(dropapk && { dropapk }),
            ...(ufile && { ufile }),
          },
        };

        fullLinks.push(newDownload);
      }
    });
  }
}

async function parseWeekPage(url: string) {
  console.log("Parsing week page at URL:", url);

  const page = await loadPage(url);

  const comicPageUrls: string[] = [];
  page('a[rel="noopener noreferrer"]').each((i, anchorSel) => {
    const anchor = page(anchorSel);
    comicPageUrls.push(anchor.attr("href") as string);
  });

  for (let i = 0; i < comicPageUrls.length; i += 1) {
    await parseDownloadLinks(comicPageUrls[i]);
  }
}

async function parseIndexPage(url: string) {
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
      await parseWeekPage(comicPageUrl);
    } else {
      await parseDownloadLinks(comicPageUrl);
    }
  }

  const hasNextPage = !!page("a.pagination-older").text();
  if (!hasNextPage) {
    console.log("No more pages left, stopping");
  }
  return hasNextPage;
}

const BASE_URL = "https://getcomics.info";

interface GetComicsOptions {
  /**
   * The directory to store the downloaded comics in.
   *
   * @defaultValue `process.cwd()`
   */
  output: string;

  /**
   * The number of pages to download comics for.
   *
   * Pass `0` to download all available pages.
   *
   * @defaultValue `1`
   */
  pages: number;

  /**
   * The page to start parsing comic links on.
   *
   * @defaultValue `1`
   */
  start: number;

  /**
   * If passed, new comics with the same filenames will overwrite existing files with the same names.
   */
  overwrite?: boolean;

  /**
   * When passed, a file named links_<DateTime>.json will be saved in the same directory as the downloaded comics.
   */
  saveLinks?: boolean;

  /**
   * A tag to use as the starting point for the downloads.
   */
  tag?: string;

  /**
   * A search query to use for downloading
   */
  query?: string;

  /**
   * A GetComics category to use for downloading (will be overridden by tag)
   */
  category?: string;
}

const DEFAULT_OPTIONS: GetComicsOptions = {
  pages: 1,
  start: 1,
  output: process.cwd(),
};

async function getComics(opts: Partial<GetComicsOptions>) {
  const options: GetComicsOptions = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  if (options.pages < 1) {
    options.pages = 1;
  }

  await mkdirp(options.output);

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
    hasNextPage = await parseIndexPage(indexUrl);
    currPage += 1;
  }

  console.log(fullLinks);

  for (let i = 0; i < fullLinks.length; i += 1) {
    const {
      links: { main, mirror, mega, mediafire, zippyshare },
    } = fullLinks[i];

    let success = false;

    if (!success && zippyshare) {
      try {
        console.log("\nAttempting download from ZippyShare");
        await downloadComic(zippyshare, options.output);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    if (!success && mediafire) {
      try {
        console.log("\nAttempting download from MediaFire");
        await downloadComic(mediafire, options.output);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    if (!success && mega) {
      try {
        console.log("\nAttempting download from mega.nz");
        await downloadComic(mega, options.output);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from Mega.nz:\n",
          (err as Error).message
        );
      }
    }

    if (!success && main) {
      try {
        console.log("\nAttempting download from GetComics' main servers");
        await downloadComic(main, options.output);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }

    if (!success && mirror) {
      try {
        console.log("\nAttempting download from GetComics' mirror servers");
        await downloadComic(mirror, options.output);
        success = true;
      } catch (err) {
        console.error(
          "Error downloading from MediaFire:\n",
          (err as Error).message
        );
      }
    }
  }

  console.log("\nFinished downloading all comics!");
}

export default getComics;
