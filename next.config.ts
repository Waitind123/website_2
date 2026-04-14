import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN/dev-host access so client JS/CSS are not blocked
  // when opening the app via local network IP.
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.168.49.66:3000",
    "http://10.168.49.66:3001",
  ],
};

export default nextConfig;
