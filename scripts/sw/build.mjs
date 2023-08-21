import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

let version = process.env.PRODUCT_VERSION;

const isDevelopment = process.argv.includes("--dev");
const isProduction = process.argv.includes("--prod");

if (isDevelopment && isProduction) {
  throw new Error("--dev and --prod are mutually exclusive.");
} else if (!isDevelopment && !isProduction) {
  throw new Error("One of --dev or --prod are mutually exclusive.");
}

let NODE_ENV;

// production
if (isDevelopment) NODE_ENV = "development";
if (isProduction) NODE_ENV = "production";

if (!version) {
  const gitDescribeResult = execSync("git describe --always --dirty --tags");

  version = gitDescribeResult.toString("utf8").split("\n").at(0);
}

esbuild.buildSync({
  entryPoints: ["app/entry.worker.ts"],
  define: {
    "process.env.PRODUCT_VERSION": `"${version}"`,
    "process.env.NODE_ENV": `"${NODE_ENV}"`,
  },
  outfile: "public/sw.js",
  bundle: true,
  format: "esm",
  minify: isProduction,
});
