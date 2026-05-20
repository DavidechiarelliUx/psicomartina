import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/shared/SectionHeading";
import { blogPosts } from "@/data/blogPosts";
import { apiFetch } from "@/api/client";

const BLOG_IMG = "/images/blog-cover.png";

const categoryLabels = {
  ansia: "Ansia",
  relazioni: "Relazioni",
  autostima: "Autostima",
  traumi: "Traumi",
  crescita_personale: "Crescita Personale",
  benessere: "Benessere",
};

export default function Blog() {
  const { data } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => apiFetch("/api/blog-posts"),
  });
  const sourcePosts = data?.length ? data : blogPosts;
  const publishedPosts = sourcePosts.filter((p) => p.published !== false);

  return (
    <div className="pt-24 md:pt-28">
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            label="Blog"
            title="Risorse per il tuo benessere"
            description="Articoli e riflessioni per accompagnarti nel percorso di crescita personale."
          />

          {publishedPosts.length === 0 ? (
            <div className="text-center py-20">
              <img src={BLOG_IMG} alt="Blog" className="w-full max-w-md mx-auto rounded-2xl mb-8 opacity-80" />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">I prossimi articoli arriveranno presto</h3>
              <p className="text-muted-foreground">Sto preparando contenuti utili per il tuo benessere. Torna a trovarmi!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/blog/${post.slug || post.id}`} className="group block h-full">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden h-full hover:shadow-lg transition-all duration-500">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.cover_image || BLOG_IMG}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {categoryLabels[post.category] || post.category}
                            </Badge>
                          )}
                          {post.reading_time && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" /> {post.reading_time} min
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-4 group-hover:gap-3 transition-all duration-300">
                          Leggi <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
