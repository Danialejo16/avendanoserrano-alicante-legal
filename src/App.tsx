import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Team from "./pages/Team.tsx";
import AdminTeam from "./pages/AdminTeam.tsx";
import { Navigate } from "react-router-dom";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import AdminBlog from "./pages/AdminBlog.tsx";
import AdminBlogEdit from "./pages/AdminBlogEdit.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import NotFound from "./pages/NotFound.tsx";
import PageTransition from "./components/PageTransition.tsx";
import CookieConsent from "./components/CookieConsent.tsx";
import LegalChatbot from "./components/LegalChatbot.tsx";
import NewsletterPopup from "./components/NewsletterPopup.tsx";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe.tsx";
import AdminNewsletter from "./pages/AdminNewsletter.tsx";
import AdminAppointments from "./pages/AdminAppointments.tsx";
import AdminContent from "./pages/AdminContent.tsx";
import AdminGallery from "./pages/AdminGallery.tsx";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/equipo" element={<Team />} />
            <Route path="/curriculum" element={<Navigate to="/equipo" replace />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/blog/:id" element={<AdminBlogEdit />} />
            <Route path="/admin/newsletter" element={<AdminNewsletter />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />
            <Route path="/admin/team" element={<AdminTeam />} />
            <Route path="/newsletter-unsubscribe" element={<NewsletterUnsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
        <LegalChatbot />
        <NewsletterPopup />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
