import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @returns {import('next').NextConfig} */
const nextConfig = phase => ({
  // Production validation must not replace files served by a running preview,
  // including the JavaScript chunks used by the monitor's embedded desktop.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});

export default nextConfig;
