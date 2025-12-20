/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ensure subpath exports are resolved correctly
    config.resolve.conditionNames = ['import', 'require', 'default'];
    // Enable package.json exports field resolution
    config.resolve.exportsFields = ['exports', 'main'];
    
    // Externalize server-side dependencies for API routes
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'bullmq': 'commonjs bullmq',
        'ioredis': 'commonjs ioredis',
        '@upstash/redis': 'commonjs @upstash/redis',
        '@upstash/ratelimit': 'commonjs @upstash/ratelimit',
        'drizzle-orm': 'commonjs drizzle-orm',
        '@neondatabase/serverless': 'commonjs @neondatabase/serverless',
        'pg': 'commonjs pg',
        'groq-sdk': 'commonjs groq-sdk',
        'resend': 'commonjs resend',
      });
    }
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval' " : ''}https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ${process.env.NODE_ENV === 'development' ? 'http://localhost:3001 ' : ''}https://vibecode-audit-production.up.railway.app; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
