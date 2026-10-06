import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/platform/:path*', destination: `${process.env.BACKEND_URL}/api/platform/:path*` },
    ];
  },
};
export default nextConfig;