module.exports = (config, env, helpers) => {
  const postCssLoaders = helpers.getLoadersByName(config, "postcss-loader");
  postCssLoaders.forEach(({ loader }) => {
    const plugins = loader.options.plugins;

    // Add tailwind css at the top.
    plugins.unshift(require("tailwindcss"));
  });
  if (config.devServer) {
    config.devServer.historyApiFallback = {
      ...config.devServer.historyApiFallback,
      disableDotRule: true
    };
  }
  return config;
};
