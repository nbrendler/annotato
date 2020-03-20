module.exports = (config, env, helpers) => {
  const purgecss = require("@fullhuman/postcss-purgecss")({
    content: ["./src/**/*.js"],
    defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    whitelistPatterns: [/^hljs.*/]
  });

  const postCssLoaders = helpers.getLoadersByName(config, "postcss-loader");
  postCssLoaders.forEach(({ loader }) => {
    const plugins = loader.options.plugins;

    // Add tailwind css at the top.
    plugins.unshift(require("tailwindcss"));

    // Add PurgeCSS only in production.
    if (env.production) {
      plugins.push(purgecss);
    }
  });

  if (config.devServer) {
    config.devServer.historyApiFallback = {
      ...config.devServer.historyApiFallback,
      disableDotRule: true
    };
  }
  return config;
};
