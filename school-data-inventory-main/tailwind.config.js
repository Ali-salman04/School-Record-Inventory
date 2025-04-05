/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brightColor: "#FF6347", // This is the correct place for custom colors
        backgroundColor: "#b7bca9",
      },
    },
  },
  plugins: [],
}
