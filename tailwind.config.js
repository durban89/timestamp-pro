/** @type {import('tailwindcss').Config} */
export default {
  // ⭐ 告诉 Tailwind 去哪里扫描包含 className 的 React 文件
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{html,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}