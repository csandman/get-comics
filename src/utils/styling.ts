import chalk from "chalk";

const GET_COMICS_COLOR = "#EAC114";
const MEGA_COLOR = "#D9272E";
const MEDIAFIRE_COLOR = "#0070F0";
const ZIPPSHARE_COLOR = "#fae793";
const USERSCLOUD_COLOR = "#E10021";

export const getComicsStyle = chalk.hex(GET_COMICS_COLOR).bold;
export const megaStyle = chalk.hex(MEGA_COLOR).bold;
export const mediaFireStyle = chalk.hex(MEDIAFIRE_COLOR).bold;
export const zippyShareStyle = chalk.hex(ZIPPSHARE_COLOR).bold;
export const usersCloudStyle = chalk.hex(USERSCLOUD_COLOR).bold;

export const styledGetComics = getComicsStyle("GetComics");
export const styledMega = megaStyle("MEGA");
export const styledMediaFire = mediaFireStyle("MediaFire");
export const styledZippyShare = zippyShareStyle("ZippyShare");
export const styledUsersCloud = usersCloudStyle("Userscloud");
