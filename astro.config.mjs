import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sigs-uci.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { server: { fs: { strict: true, allow: ['src', 'public', 'node_modules'], deny: ['**/.git/**', '**/*.pem', '**/*.key', '**/.env*'] } } },
});
