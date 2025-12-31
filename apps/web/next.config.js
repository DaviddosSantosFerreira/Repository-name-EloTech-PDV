/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configurações para evitar problemas no Windows/OneDrive
  webpack: (config, { isServer }) => {
    return config
  },
}

module.exports = nextConfig
