import { createWriteStream, existsSync } from "fs";
import path from "path";
import cliProgress from "cli-progress";
import fetch from "node-fetch";
import prettyBytes from "pretty-bytes";

async function downloadComic(comicUrl: string, outputPath: string) {
  try {
    const redirectRes = await fetch(comicUrl, {
      method: "HEAD",
      redirect: "manual",
    });
    const redirectUrl = redirectRes.headers.get("location");
    if (!redirectUrl) {
      throw new Error("No redirect url found");
    }
    const fileName = redirectUrl.split("/").pop() as string;
    const cleanFileName = decodeURIComponent(fileName);
    console.log("\nDownloading Comic:", cleanFileName);

    const res = await fetch(redirectUrl);
    const outputFilePath = path.join(outputPath, cleanFileName);
    if (existsSync(outputFilePath)) {
      console.log("Comic file already exists, skipping");
      return;
    }

    const fileStream = createWriteStream(outputFilePath);

    const progressBar = new cliProgress.SingleBar(
      {
        format: "[{bar}] {percentage}% | {value} / {total}",
        formatValue: (value, opts, type) =>
          ["total", "value"].includes(type)
            ? prettyBytes(value)
            : value.toString(),
      },
      cliProgress.Presets.shades_classic
    );
    progressBar.start(Number(res.headers.get("content-length")), 0);
    let totalBytes = 0;

    await new Promise<void>((resolve, reject) => {
      res.body?.pipe(fileStream);
      res.body?.on("error", reject);
      res.body?.on("data", (chunk) => {
        totalBytes += chunk.length;
        progressBar.update(totalBytes);
      });
      fileStream.on("finish", () => {
        progressBar.stop();
        console.log("Finished downloading comic:", outputFilePath);
        resolve();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

export default downloadComic;
