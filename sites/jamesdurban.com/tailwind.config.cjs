/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "#090b11",
        secondary: "#f2aa4cff",
        quaternary: "#d1d5db",
      },
      fontFamily: {
        poppins: ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
