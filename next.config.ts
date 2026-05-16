import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nodemailer et serpapi utilisent des modules Node.js natifs — ne pas bundler
  serverExternalPackages: ["nodemailer", "serpapi"],
};

export default nextConfig;
