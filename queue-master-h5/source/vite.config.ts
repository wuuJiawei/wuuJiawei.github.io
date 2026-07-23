import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/queue-master-h5/",
  plugins: [react()],
});
