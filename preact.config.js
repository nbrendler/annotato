const tailwind = require("preact-cli-tailwind");

module.exports = (config, env, helpers) => {
  config = tailwind(config, env, helpers);
  if (config.devServer) {
    config.devServer.historyApiFallback = {
      ...config.devServer.historyApiFallback,
      disableDotRule: true
    };
  }
  return config;
};
