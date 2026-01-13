/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'f4l2c3q6cm.ufs.sh',
      },
    ],
  },
}

module.exports = nextConfig

