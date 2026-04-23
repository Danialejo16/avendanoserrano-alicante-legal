import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Calendar, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

const localeMap: Record<string, string> = {
  es: "es-ES",
  en: "en-GB",
  ar: "ar",
  ru: "ru-RU",
  zh: "zh-CN",
};

const Blog = () => {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = localeMap[i18n.language] ?? "es-ES";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,cover_image_url,published_at,created_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);
      setPosts((data ?? []) as PostListItem[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("blog.title")}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("blog.subtitle")}
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                {t("blog.empty")}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group rounded-xl overflow-hidden bg-card border border-border hover:shadow-lg transition-all duration-300 flex flex-col"
                >
                  {p.cover_image_url ? (
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-gradient-to-br from-secondary to-muted" />
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3" />
                      {new Date(p.published_at ?? p.created_at).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </h2>
                    {p.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {p.excerpt}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary">
                      {t("blog.readMore")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-20">
            <button
              onClick={() => navigate("/", { state: { scrollTo: "contacto" } })}
              className="w-full text-left bg-card border border-border rounded-xl p-8 md:p-10 hover:border-highlight hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-14 h-14 rounded-lg bg-navy-deep flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-highlight-light" />
                </div>
                <div className="flex-1">
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {t("blog.ctaTitle")}
                  </h2>
                  <p className="text-muted-foreground font-body">
                    {t("blog.ctaText")}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-highlight font-semibold group-hover:translate-x-1 transition-transform">
                  {t("blog.ctaButton")} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
