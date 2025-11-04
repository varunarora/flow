/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        has: [],
        destination: 'https://oc-flow.firebaseapp.com/__/auth/:path*',  // Your Firebase project domain
      },
    ];
  },
}

module.exports = nextConfig
