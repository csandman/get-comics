# get-comics

`get-comics` is a tool to download a list of comics from the site
https://getcomics.info.

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

  -o, --output <string>   The location to store the resulting files in.
                          Defaults to the current directory.

  -p, --pages <number>    The total number of pages to download, starting from the most recent
                          If you pass 0, all available pages will be downloaded.

Filter Options

  -q, --query <string>    A search query to filter comics with.
                          ex. "Donald Duck"

  -t, --tag <string>      A GetComics specific tag page to download comics with.
                          This can be found in the URL of the site at /tag/<TAG>.
                          ex. "the-walking-dead" or "superman"

  -c, --category <string> A GetComics specific category for comics.
                          This can be found in the URL of the site at /cat/<CATEGORY>
                          ex. "dc" or "marvel"
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
