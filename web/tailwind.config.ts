import type { Config } from 'tailwindcss';
import flowbitePlugin from 'flowbite/plugin';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/flowbite/**/*.js',
    './node_modules/flowbite-react/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [flowbitePlugin],
};

export default config;
