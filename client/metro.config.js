const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const contractRoot = path.resolve(projectRoot, "../server/packages/api-contract");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [...(config.watchFolders ?? []), contractRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(contractRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "@pending/api-contract": contractRoot,
};

module.exports = withNativeWind(config, { input: "./global.css" });
