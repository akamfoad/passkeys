/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  serverModuleFormat: "esm",
  tailwind: true,
  serverDependenciesToBundle: [
    "@simplewebauthn/browser",
    "@remix-pwa/sw",
    "otpauth",
  ],
};
