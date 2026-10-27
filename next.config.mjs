/** @type {import('next').NextConfig} */
const nextConfig = {
  // Q-Maid prototype lives in its own Vercel project; serve it at /q-maid.
  async rewrites() {
    return [
      { source: "/q-maid", destination: "https://q-maid-prototype.vercel.app/q-maid" },
      { source: "/q-maid/:path*", destination: "https://q-maid-prototype.vercel.app/q-maid/:path*" },
    ];
  },
};

export default nextConfig;
