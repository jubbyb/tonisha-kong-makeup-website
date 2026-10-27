import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  // maplibre-gl resolves its web worker relative to its own module URL, which
  // breaks once Vite pre-bundles it into node_modules/.vite/deps.
  optimizeDeps: { exclude: ['maplibre-gl'] },
});

// import { defineConfig } from 'vite';
// import tailwindcss from '@tailwindcss/vite';

// export default defineConfig({
//   plugins: [
//     tailwindcss()
//   ],
// });
