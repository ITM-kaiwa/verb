import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Overall app theme: soft, warm beige (matches the sibling kanji app).
        sand: {
          50: "#FBF8F1",
          100: "#F6F0E4",
          200: "#EDE2CB",
          300: "#E0CFA8",
          400: "#CBAE78",
          500: "#B08D57",
          600: "#8C6D3F",
          700: "#6B5230",
          800: "#4C3A22",
        },
        lemon: {
          100: "#FDFAE2",
          200: "#FAF3B8",
          300: "#F4E888",
        },
        leaf: {
          100: "#E7F3DE",
          200: "#D0E8BE",
          300: "#B4D89A",
          400: "#95C476",
        },
        kanjibrown: {
          DEFAULT: "#6B4226",
          dark: "#4A2C18",
        },
        correct: {
          DEFAULT: "#2F7D3C",
        },
        wrong: {
          DEFAULT: "#C1443A",
        },
      },
      fontFamily: {
        kyokasho: [
          '"UD デジタル 教科書体 N-R"',
          '"UDDigiKyokashoN-R"',
          '"UD Digital Kyokasho NK-R"',
          '"HGS教科書体"',
          '"HG教科書体"',
          '"游教科書体"',
          '"YuKyokasho Yoko"',
          "serif",
        ],
        vietnamese: ['"Times New Roman"', "Times", "serif"],
      },
      boxShadow: {
        card: "0 8px 24px -8px rgba(107, 66, 38, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
