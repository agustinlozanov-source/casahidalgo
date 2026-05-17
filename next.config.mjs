/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Optimizaciones para Netlify
    optimizePackageImports: ['@supabase/supabase-js']
  }
};

export default nextConfig;
