# get-comics

`get-comics` is a tool to download a list of comics from the site
https://getcomics.org.

It is based on the package [ComicScraper](https://github.com/Gink3/ComicScraper) by [Gink3](https://github.com/Gink3).

## Installation

This package is built using Node.js, and requires node v12.17 or higher to be run because it uses ES Modules.

To install the command globally run this command:

```sh
npm i -g get-comics
```

## Usage

To download comics to your current directory, run this command anywhere:

```sh
get-comics
```

You can filter which comics you'd like to download and determine how many pages you'd like to download using these flags:

```
Basic Options

  -h, --help              Display this usage guide.

  -o, --output string     The location to store the resulting files in. If the directory does not
                          exist, it will be created.
                          Defaults to the current directory.

  -w, --overwrite         If passed, new comics with the same filenames will overwrite existing files
                          with the same names.

  -l, --save-links        When passed, a file named links_<DateTime>.json will be saved in the same
                          directory as the downloaded comics.
  -b, --base-url string   The base URL to use for downloading comics. This should only be changed if
                          the GetComics site changes its domain.

Selection Options

  -p, --pages number   The total number of pages to download, starting from the most recently
                       uploaded.
                       If you pass 0, all available pages will be downloaded.

  -s, --start number   The page to start parsing comic links on.

Filter Options

  -u, --url string        A specific GetComics page URL to download all comics from. If this option is
                          passed, most other selection options will be ignored.
                          ex. https://getcomics.org/other-comics/gideon-falls-deluxe-edition-book-1-
                          the-legend-of-the-black-barn-2021/

  -q, --query string      A search query to filter comics with.
                          ex. "Donald Duck"

  -t, --tag string        A GetComics specific tag page to download comics with.
                          This can be found in the URL of the site at /tag/<TAG>.
                          ex. "the-walking-dead" or "superman"

  -c, --category string   A GetComics specific category for comics.
                          This can be found in the URL of the site at /cat/<CATEGORY>
                          ex. "dc" or "marvel"

Processing Options

  --no-extract    By default any .zip archives containing a collection of comics will be
                  extracted and the archive file will be removed. If this option is passed, the
                  archive file will be left as is.

  -z, --cbz       Convert any downloaded .cbr files to .cbz
```

## Examples

Download the entire Marvel archive to the root folder `comics`:

```sh
get-comics -c marvel -p 0 -o "~/comics"
```

Download the most recent 5 pages of comics from the homepage:

```sh
get-comics -p 5
```

Download the most recent page of comics tagged with "the-walking-dead":

```sh
get-comics --tag the-walking-dead
```

## Package usage

In order to use this package in your own node apps, you can install it and use it like this:

```sh
npm install get-comics
```

```js
import getComics from "get-comics";

async function downloadAllComics() {
  await getComics({
    pages: 3,
    tag: "superman",
    noExtract: true,
    saveLinks: true,
  });

  console.log("Finished downloading comics");
}

downloadAllComics();
```
