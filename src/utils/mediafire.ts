import fetch from "node-fetch";
import loadPage from "./load-page";

// some mediafire links are instant downloads
// and that will potentially crash our JSDOM parsing or make node run out of memory
// so this function makes sure that the given link returns "text/html" content-type
async function checkLinkResponseType(link: string) {
  const { headers } = await fetch(link, { method: "HEAD" });

  // content type is something other than html
  const contentType = headers.get("content-type");
  if (!contentType?.includes("text/html")) {
    return contentType;
  }

  return false;
}

export async function getMediafireLink(link: string) {
  const validLink =
    /^(http|https):\/\/(?:www\.)?(mediafire)\.com\/[0-9a-z]+(\/.*)/gm;

  if (!link.match(validLink)) {
    throw new Error("Unknown link");
  }

  // make sure we are going to be handling html before requesting data
  const type = await checkLinkResponseType(link);

  // TODO: return link based on content-type
  // right now we just assume anything besides text/html is a direct dl link
  if (type) {
    return link;
  }

  const page = await loadPage(link);

  const downloadButton = page("#downloadButton");

  if (!downloadButton) {
    throw new Error("Could not find download button");
  }

  return downloadButton.attr("href");
}
