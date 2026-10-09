import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/platform/:path*', destination: `${(process.env.BACKEND_URL || 'https://e-admin-backend-swqf.onrender.com').trim().replace(/\/+$/, '')}/api/platform/:path*` },
    ];
  },
};
export default nextConfig;