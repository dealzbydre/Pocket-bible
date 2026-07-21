/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle so the Docker image can be small.
  output: "standalone",
};

module.exports = nextConfig;
