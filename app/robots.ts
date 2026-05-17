import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prospeo-six.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/sign-in", "/sign-up"],
        disallow: ["/app/", "/api/", "/app/admin"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
