import fetch from 'node-fetch';
import { load as loadPage } from 'cheerio';
import { createWriteStream } from 'fs';
import cliProgress from 'cli-progress';
import prettyBytes from 'pretty-bytes';

const downloadLinks = new Set<string>();

async function downloadComic(comicUrl: string, outputPath: string) {
  const redirectRes = await fetch(comicUrl, {
    method: 'HEAD',
    redirect: 'manual',
  });
  const redirectUrl = redirectRes.headers.get('location');
  const fileName = redirectUrl.split('/').pop();
  const cleanFileName = decodeURIComponent(fileName);
  console.log('\nDownloading Comic:', cleanFileName);

  const res = await fetch(redirectUrl);
  const outputFilePath = `${outputPath}/${cleanFileName}`;
  const fileStream = createWriteStream(outputFilePath);

  const progressBar = new cliProgress.SingleBar(
    {
      format: '[{bar}] {percentage}% | {value} / {total}',
      formatValue: (value, opts, type) =>
        ['total', 'value'].includes(type)
          ? prettyBytes(value)
          : value.toString(),
    },
    cliProgress.Presets.shades_classic
  );
  progressBar.start(Number(res.headers.get('content-length')), 0);
  let totalBytes = 0;

  await new Promise<void>((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    res.body.on('data', (chunk) => {
      totalBytes += chunk.length;
      progressBar.update(totalBytes);
    });
    fileStream.on('finish', () => {
      progressBar.stop();
      console.log('Finished downloading comic:', outputFilePath);
      resolve();
    });
  });
}

async function parseDownloadLink(url: string) {
  console.log('Parsing download link from page at URL:', url);

  const res = await fetch(url);
  const data = await res.text();
  const page = loadPage(data);

  const mainDownloadLink = page('a[title="Download Now"]').attr('href');

  if (mainDownloadLink) {
    // const title = page('section.post-contents h2').text();
    // console.log(title);
    downloadLinks.add(mainDownloadLink);
  } else {
    page('a[rel="noopener noreferrer"]').each((i, anchorSel) => {
      const anchor = page(anchorSel);
      const anchorText = anchor.text().trim();
      if (anchorText === 'Main Server') {
        const downloadLink = anchor.attr('href') as string;
        downloadLinks.add(downloadLink);
      }
    });
  }
}

async function parseWeekPage(url: string) {
  console.log('Parsing week page at URL:', url);

  const res = await fetch(url);
  const data = await res.text();
  const page = loadPage(data);

  const comicPageUrls: string[] = [];
  page('a[rel="noopener noreferrer"]').each((i, anchorSel) => {
    const anchor = page(anchorSel);
    comicPageUrls.push(anchor.attr('href') as string);
  });

  for (let i = 0; i < comicPageUrls.length; i += 1) {
    await parseDownloadLink(comicPageUrls[i]);
  }
}

async function parseIndexPage(url: string) {
  console.log('Parsing index page at URL:', url);

  const res = await fetch(url);
  const data = await res.text();
  const page = loadPage(data);

  const comicPageUrls: string[] = [];

  page('h1.post-title a').each((i, comicPageLinkSel) => {
    const comicPageLink = page(comicPageLinkSel);
    comicPageUrls.push(comicPageLink.attr('href') as string);
  });

  for (let i = 0; i < comicPageUrls.length; i += 1) {
    const comicPageUrl = comicPageUrls[i];

    if (comicPageUrl.includes('week')) {
      await parseWeekPage(comicPageUrl);
    } else {
      await parseDownloadLink(comicPageUrl);
    }
  }

  const hasNextPage = !!page('a.pagination-older').text();
  if (!hasNextPage) {
    console.log('No more pages left, stopping');
  }
  return hasNextPage;
}

const BASE_URL = 'https://getcomics.info';

interface GetComicsOptions {
  /**
   * The directory to store the downloaded comics in.
   *
   * @defaultValue `process.cwd()`
   */
  output?: string;

  /**
   * The number of pages to download comics for.
   *
   * Pass `0` to download all available pages.
   *
   * @defaultValue `1`
   */
  pages?: number;

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
  output: process.cwd(),
};

async function getComics(opts: GetComicsOptions) {
  const options: GetComicsOptions = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  console.log('OPTIONS', options);

  let baseUrl = BASE_URL;
  if (options.tag) {
    baseUrl = `${baseUrl}/tag/${options.tag}`;
  } else if (options.category) {
    baseUrl = `${baseUrl}/tag/${options.category}`;
  }

  let queryStr = '';
  if (options.query) {
    queryStr = `?s=${encodeURIComponent(options.query)}`;
  }

  let currPage = 1;
  let hasNextPage = true;

  while (hasNextPage && (currPage <= options.pages || options.pages <= 0)) {
    const indexUrl =
      currPage === 0
        ? `${baseUrl}${queryStr}`
        : `${baseUrl}/page/${currPage}${queryStr}`;
    hasNextPage = await parseIndexPage(indexUrl);
    currPage += 1;
  }

  const downloadLinksArr = [...downloadLinks];
  for (let i = 0; i < downloadLinksArr.length; i += 1) {
    await downloadComic(downloadLinksArr[i], options.output);
  }

  console.log('\nFinished downloading all comics!');
}

export default getComics;
