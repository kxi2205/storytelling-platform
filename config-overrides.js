module.exports = function override(config) {
  config.ignoreWarnings = [
    {
      message: /Failed to parse source map/,
    },
  ];
  return config;
};
