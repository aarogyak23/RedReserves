import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000, // Default server port, change it if needed
  },
  build: {
    outDir: "dist", // Output directory for build files
  },
  resolve: {
    alias: {
      "@": "/src", // Setup an alias for the 'src' directory
    },
  },
});
