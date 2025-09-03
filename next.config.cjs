/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { 
        protocol: 'https', 
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**'
      },
      { 
        protocol: 'https', 
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**'
      }
    ],
    domains: ['images.unsplash.com', 'picsum.photos']
  }
}

module.exports = nextConfig
