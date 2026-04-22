import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // instrumentationHook is stable in Next.js 15 — no longer an experimental flag
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co',        port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos',       port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com',  port: '', pathname: '/**' },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
