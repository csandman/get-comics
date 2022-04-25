#! /usr/bin/env node
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import getComics from "../dist/index.js";

const basicOptions = [
  {
    name: "help",
    alias: "h",
    description: "Display this usage guide.\n",
    type: Boolean,
  },
  {
    name: "output",
    alias: "o",
    description:
      "The location to store the resulting files in. If the directory does not exist, it will be created.\nDefaults to the current directory.\n",
    type: String,
    defaultValue: process.cwd(),
  },
  {
    name: "overwrite",
    alias: "w",
    description:
      "If passed, new comics with the same filenames will overwrite existing files with the same names.\n",
    type: Boolean,
  },
  {
    name: "save-links",
    alias: "l",
    description:
      "When passed, a file named links_<DateTime>.json will be saved in the same directory as the downloaded comics.\n",
    type: Boolean,
  },
  {
    name: "no-extract",
    description:
      "By default any .zip archives containing a collection of comics will be extracted and the archive file will be removed. If this option is passed, the archive file will be left as is.",
    type: Boolean,
  },
];

const selectionOptions = [
  {
    name: "pages",
    alias: "p",
    description:
      "The total number of pages to download, starting from the most recently uploaded.\nIf you pass 0, all available pages will be downloaded.\n",
    type: Number,
    defaultValue: 1,
  },
  {
    name: "start",
    alias: "s",
    description: "The page to start parsing comic links on.",
    type: Number,
    defaultValue: 1,
  },
];

const filterOptions = [
  {
    name: "url",
    alias: "u",
    description:
      "A specific GetComics page URL to download all comics from. If this option is passed, most other selection options will be ignored.\nex. https://getcomics.info/other-comics/gideon-falls-deluxe-edition-book-1-the-legend-of-the-black-barn-2021/\n",
    type: String,
  },
  {
    name: "query",
    alias: "q",
    description: 'A search query to filter comics with.\nex. "Donald Duck"\n',
    type: String,
  },
  {
    name: "tag",
    alias: "t",
    description:
      'A GetComics specific tag page to download comics with.\nThis can be found in the URL of the site at /tag/<TAG>.\nex. "the-walking-dead" or "superman"\n',
    type: String,
  },
  {
    name: "category",
    alias: "c",
    description:
      'A GetComics specific category for comics.\nThis can be found in the URL of the site at /cat/<CATEGORY>\nex. "dc" or "marvel"',
    type: String,
  },
];

const { help, ...options } = commandLineArgs(
  [...basicOptions, ...selectionOptions, ...filterOptions],
  { camelCase: true }
);

if (help) {
  const asciiText = `
╔═╗╔═╗╔╦╗  ╔═╗╔═╗╔╦╗╦╔═╗╔═╗
║ ╦║╣  ║───║  ║ ║║║║║║  ╚═╗
╚═╝╚═╝ ╩   ╚═╝╚═╝╩ ╩╩╚═╝╚═╝
`;

  const usage = commandLineUsage([
    {
      content: asciiText,
      raw: true,
    },
    {
      content: ["Download recent comics from https://getcomics.info"],
    },
    {
      header: "Basic Options",
      optionList: basicOptions,
    },
    {
      header: "Selection Options",
      optionList: selectionOptions,
    },
    {
      header: "Filter Options",
      optionList: filterOptions,
    },
    {
      content: "GitHub: {underline https://github.com/csandman/get-comics}",
    },
  ]);

  console.log(usage);
} else {
  getComics(options);
}
