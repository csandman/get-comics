export interface GetComicsOptions {
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
   *
   * @example
   * ```sh
   * output/links_2022-04-23_03-39-49.json
   * ```
   */
  saveLinks?: boolean;

  /**
   * A specific GetComics download page URL to download comics from.
   *
   * @example
   *
   * ```sh
   * "https://getcomics.info/other-comics/gideon-falls-deluxe-edition-book-1-the-legend-of-the-black-barn-2021/"
   * ```
   */
  url?: string;

  /**
   * A tag to use as the starting point for the downloads.
   *
   * @example
   * ```sh
   * "the-walking-dead"
   * "superman"
   * ```
   */
  tag?: string;

  /**
   * A search query to use for downloading
   *
   * @example
   * ```sh
   * "Donald Duck"
   * ```
   */
  query?: string;

  /**
   * A GetComics category to use for downloading (will be overridden by tag)
   */
  category?: string;

  /**
   * By default any .zip archives containing a collection of comics will be
   * extracted and the archive file will be removed. If this option is passed,
   * the archive file will be left as is.
   */
  noExtract?: boolean;

  /**
   * Convert any downloaded .cbr files to .cbz
   */
  cbz?: boolean;
}

export interface ComicLink {
  /**
   * The title of the comic on GetComics
   */
  title: string;
  /**
   * The URL that the comic download link is parsed from
   */
  pageUrl: string;
  /**
   * A list of links to file hosting sites to a comic from
   */
  links: {
    /**
     * A download link from <random subdomain>.comicfiles.ru
     *
     * Automatic downloading from this type of link is supported
     */
    main?: string;
    /**
     * An alternate download link from <random subdomain>.comicfiles.ru
     *
     * Automatic downloading from this type of link is supported
     */
    mirror?: string;
    /**
     * A download link from mega.nz
     *
     * Automatic downloading from this type of link is supported
     */
    mega?: string;
    /**
     * A download link from www.mediafire.com
     *
     * Automatic downloading from this type of link is supported
     */
    mediafire?: string;
    /**
     * A download link from www.zippyshare.com
     *
     * Automatic downloading from this type of link is supported
     */
    zippyshare?: string;
    /**
     * A download link from getcomics.ufile.io
     */
    ufile?: string;
    /**
     * A download link from dropapk.to
     */
    dropapk?: string;
    /**
     * A download link from cloud.mail.ru
     */
    cloudmail?: string;
    /**
     * A download link from userscloud.com
     *
     * Automatic downloading from this type of link is supported
     */
    userscloud?: string;
  };
}
