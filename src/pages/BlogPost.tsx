import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sanitizeBlogHtml } from "@/lib/blog";
import "@/styles/blog-content.css";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setPost(data as Post);
      setLoading(false);
    })();
  }, [slug]);

  // SEO
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | Avendaño Serrano Abogados`;
    const desc = post.excerpt?.slice(0, 155) ?? post.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [post]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 md:px-12 max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al blog
          </Link>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : notFound || !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold mb-2">Entrada no encontrada</h1>
              <p className="text-muted-foreground">Esta publicación no existe o ya no está disponible.</p>
            </div>
          ) : (
            <article>
              <header className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">{post.title}</h1>
                {post.excerpt && (
                  <p className="text-lg text-muted-foreground">{post.excerpt}</p>
                )}
              </header>

              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full aspect-[16/9] object-cover rounded-xl mb-10 shadow-lg"
                />
              )}

              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }}
              />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
