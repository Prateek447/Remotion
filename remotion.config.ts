import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
// CRF and pixel format are intentionally left to each render command/script
// to set, because ProRes (used by the master pipeline in scripts/render.sh)
// is uncompressed and rejects --crf. H.264/H.265 commands set their own.

Config.overrideWebpackConfig((config) => {
  const updated = enableTailwind(config);
  return {
    ...updated,
    experiments: {
      ...updated.experiments,
      lazyCompilation: false,
      asyncWebAssembly: true,
    },
  };
});
