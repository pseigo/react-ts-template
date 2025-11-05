// See the Tailwind configuration guide for advanced usage
// https://v3.tailwindcss.com/docs/configuration

/* eslint-disable no-undef */
//const plugin = require("tailwindcss/plugin")
//const fs = require("fs")
//const path = require("path")
/* eslint-enable no-undef */

const config = {
  content: ["./src/unnamed_project/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        "touch/12": "calc(44px/12)",
        "touch/11": "4px",
        "touch/10": "4.4px",
        "touch/9": "calc(44px/9)",
        "touch/8": "5.5px",
        "touch/7": "calc(44px/7)",
        "touch/6": "calc(44px/6)",
        "touch/5": "calc(44px/5)",
        "touch/4": "11px",
        "touch/3": "calc(44px/3)",
        "touch/2": "22px",
        touch: "44px",
        "touch*5/4": "55px",
        "touch*3/2": "66px",
        "touch*7/4": "77px",
        "touch*2": "88px",
        "touch*5/2": "110px",
        "touch*3": "132px",
        "touch*7/2": "154px",
        "touch*4": "176px",
        "touch*9/2": "198px",
        "touch*5": "220px",
        "touch*11/2": "242px",
        "touch*6": "264px",
        "touch*13/2": "286px",
        "touch*7": "308px",
        "touch*15/2": "330px",
        "touch*8": "352px",
      },
      lineHeight: ({ theme }) => ({ ...theme("spacing") }),
      colors: {
        brand: "#005cfc",
      }
    },
  },
  plugins: [
    // eslint-disable-next-line no-undef
    require("@tailwindcss/forms"),
  ],
};

// eslint-disable-next-line no-undef
module.exports = config;
