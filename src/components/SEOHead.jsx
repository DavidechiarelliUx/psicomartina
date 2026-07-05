import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getCanonicalUrl, SITE_NAME } from "@/config/seo";

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function setLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

export default function SEOHead({ title, description, canonical, noIndex = false }) {
  const location = useLocation();

  useEffect(() => {
    const fullTitle = title
      ? title.includes("Dott.ssa Martina Giovinazzo")
        ? title
        : `${title} | ${SITE_NAME}`
      : SITE_NAME;
    const canonicalUrl = canonical || getCanonicalUrl(location.pathname);
    const robots = noIndex ? "noindex, nofollow" : "index, follow";

    document.documentElement.setAttribute("lang", "it");
    document.title = fullTitle;

    setMeta("meta[charset]", { charset: "UTF-8" });
    setMeta('meta[name="viewport"]', { name: "viewport", content: "width=device-width, initial-scale=1.0" });
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="robots"]', { name: "robots", content: robots });
    setLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });

    setMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    setMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });

    setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  }, [canonical, description, location.pathname, noIndex, title]);

  return null;
}
