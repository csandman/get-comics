#! /usr/bin/env node
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import getComics from "../dist/index.js";

const optionDefinitions = [
  { name: "output", alias: "o", type: String, defaultValue: process.cwd() },
  { name: "pages", alias: "p", type: Number, defaultValue: 1 },
  { name: "tag", alias: "t", type: String },
  { name: "query", alias: "q", type: String },
  { name: "category", alias: "c", type: String },
  { name: "help", alias: "h", type: Boolean },
];

const { help, ...options } = commandLineArgs(optionDefinitions);

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
      optionList: [
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
            "The location to store the resulting files in.\nDefaults to the current directory.\n",
          type: String,
          defaultValue: "process.cwd()",
        },
        {
          name: "pages",
          alias: "p",
          description:
            "The total number of pages to download, starting from the most recent\nIf you pass 0, all available pages will be downloaded.",
          type: Number,
        },
      ],
    },
    {
      header: "Filter Options",
      optionList: [
        {
          name: "query",
          alias: "q",
          description:
            'A search query to filter comics with.\nex. "Donald Duck"\n',
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
      ],
    },
    {
      content: "GitHub: {underline https://github.com/csandman/get-comics}",
    },
  ]);

  console.log(usage);
} else {
  getComics(options);
}
