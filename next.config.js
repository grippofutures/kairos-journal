/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Lightweight screen-record deterrent:
          // - display-capture=() prevents the page from initiating getDisplayMedia
          //   (the browser API for screen capture). This does NOT block OS-level
          //   recorders (OBS, QuickTime, etc.) — those are unblockable. Use a
          //   DRM-enabled video host (Cloudflare Stream / Mux / Vimeo Pro) when
          //   you upload course videos.
          { key: "Permissions-Policy", value: "display-capture=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
