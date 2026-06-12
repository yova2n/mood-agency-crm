import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).host : "";

// Content Security Policy — restreint d'où l'app peut charger/contacter du contenu.
// Réduit l'impact d'une éventuelle XSS et bloque les domaines tiers non autorisés.
const csp = [
  "default-src 'self'",
  // Next utilise du inline pour les scripts hydration → on doit l'autoriser
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind/Next inlinent du CSS → idem
  "style-src 'self' 'unsafe-inline'",
  // Images : self + data: pour les SVG inline + le bucket Supabase Storage
  `img-src 'self' data: blob: https://${SUPABASE_HOST}`,
  "font-src 'self' data:",
  // Connexions XHR/fetch : Supabase (REST + Realtime) + l'API gouv
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://recherche-entreprises.api.gouv.fr`,
  "frame-ancestors 'none'", // équivalent + strict de X-Frame-Options DENY
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
