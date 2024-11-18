import withPlaiceholder from "@plaiceholder/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default withPlaiceholder(nextConfig);
