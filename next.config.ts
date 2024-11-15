import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@uppy/core', '@uppy/dashboard', '@uppy/xhr-upload'],
}

export default nextConfig