import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Routes where old vanilla .html files exist in the frontend root and would be
// served instead of the React SPA. Rewrite them to index.html so React Router
// handles them.
const LEGACY_HTML_ROUTES = ["/login", "/reviews", "/watching", "/hidden", "/cast", "/movie", "/person"];

export default defineConfig({
  plugins: [
    react(),
    {
      name: "spa-legacy-rewrite",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url?.split("?")[0];
          if (LEGACY_HTML_ROUTES.includes(url)) {
            req.url = "/index.html";
          }
          next();
        });
      },
    },
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    host: true,
  },
});
