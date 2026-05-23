import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { apiFetch } from "@/api/client";
import SEOHead from "@/components/SEOHead";
import { blogSeoDescriptions, getCanonicalUrl, seoPages } from "@/config/seo";

const BLOG_IMG = "/images/blog-cover.png";

const categoryLabels = {
  ansia: "Ansia",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
  crescita_personale: "Crescita Personale",
  benessere: "Benessere",
};

export default function BlogPostPage() {
  const path = window.location.pathname;
  const slug = path.split("/blog/")[1];
  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const posts = await apiFetch("/api/cms/blog");
      return posts.find((p) => p.slug === slug || String(p.id) === slug) || null;
    },
    enabled: Boolean(slug),
    retry: false,
  });
  const post = data;

  if (isLoading && !post) {
    return (
      <div className="pt-24 md:pt-28 px-5 md:px-8 max-w-3xl mx-auto pb-20 text-center text-muted-foreground">
        <SEOHead title="Caricamento articolo" description={seoPages.blog.description} canonical={getCanonicalUrl(`/blog/${slug}`)} noIndex />
        Caricamento articolo...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-24 md:pt-28 px-5 md:px-8 max-w-3xl mx-auto pb-20 text-center">
        <SEOHead title="Articolo non trovato" description={seoPages.notFound.description} canonical={getCanonicalUrl(`/blog/${slug || ""}`)} noIndex />
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">Articolo non trovato</h1>
        <Link to="/blog">
          <Button variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="w-4 h-4" /> Torna al Blog
          </Button>
        </Link>
      </div>
    );
  }

  const postPath = `/blog/${post.slug || post.id}`;
  const description = blogSeoDescriptions[post.slug] || post.excerpt || seoPages.blog.description;

  return (
    <div className="pt-24 md:pt-28">
      <SEOHead title={post.title} description={description} canonical={getCanonicalUrl(postPath)} />
      <article className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Torna al Blog
          </Link>

          <div className="flex items-center gap-3 mb-4">
            {post.category && <Badge variant="secondary">{categoryLabels[post.category] || post.category}</Badge>}
            {post.reading_time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> {post.reading_time} min di lettura
              </span>
            )}
            {post.created_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /> {format(new Date(post.created_date), "d MMMM yyyy", { locale: it })}
              </span>
            )}
          </div>

          <h1 className="font-heading text-hero-sm md:text-display font-semibold text-foreground mb-6">{post.title}</h1>

          {(post.cover_image || BLOG_IMG) && (
            <img src={post.cover_image || BLOG_IMG} alt={post.title} className="w-full rounded-2xl mb-10 object-cover aspect-video" />
          )}

          <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
}
