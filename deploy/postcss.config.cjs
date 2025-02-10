// postcss.config.ts
const middleware = require("@midday/ui/postcss");

module.exports = {
  ...middleware,
  plugins: {
    ...middleware.plugins,
    'unocss/postcss': {},
  }
}