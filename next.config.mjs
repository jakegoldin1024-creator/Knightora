/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lichess1.org",
        pathname: "/assets/piece/**",
      },
    ],
  },
};

export default nextConfig;
