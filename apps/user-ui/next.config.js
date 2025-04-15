//@ts-check

const { composePlugins, withNx } = require("@nx/next");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  images: {
    remotePatterns: [
      {
        hostname: "ik.imagekit.io",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
