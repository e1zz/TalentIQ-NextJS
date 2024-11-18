import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@uppy/core', '@uppy/dashboard', '@uppy/xhr-upload', 'tailwind-scrollbar'],
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: 'false'
      }
    }
  }
}

export default nextConfig