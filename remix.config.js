/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  serverModuleFormat: "cjs",
  tailwind: true,
  serverDependenciesToBundle: ["@simplewebauthn/browser", "@remix-pwa/sw", "otpauth"],
};
