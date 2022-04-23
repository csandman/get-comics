import cliProgress from "cli-progress";
import prettyBytes from "pretty-bytes";

function getProgressBar(total: number | string) {
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

  progressBar.start(Number(total), 0);

  return progressBar;
}

export default getProgressBar;
