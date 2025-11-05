/** @type {import("postcss-load-config").Config */
const config = {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {}
    //...(process.env.NODE_ENV === "production" ? { cssnano: {}} : {})
  },
};

// eslint-disable-next-line no-undef
module.exports = config;
