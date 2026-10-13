import type { NextConfig } from 'next';

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  'https://e-admin-backend-swqf.onrender.com'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/platform/:path*',
        destination: `${BACKEND_URL}/api/platform/:path*`,
      },
    ];
  },
};

export default nextConfig;