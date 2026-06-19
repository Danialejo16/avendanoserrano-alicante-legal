import { Facebook, Instagram, Linkedin, Twitter, Youtube, Music2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { openCookieSettings } from "@/lib/cookies";
import { useSiteContent } from "@/hooks/use-site-content";

const ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
};

const Footer = () => {
  const { t } = useTranslation();
  const { data } = useSiteContent("general");
  return (
    <footer className="bg-secondary border-t border-border py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <img src={logo} alt="Avendaño Serrano Abogados" className="h-10 w-auto" />

        <div className="flex items-center gap-4">
          {data.socials.filter(s => s.url).map((s) => {
            const Icon = ICONS[s.icon] || Linkedin;
            return (
              <a key={s.label + s.url} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-primary-foreground hover:bg-highlight transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            );
          })}
        </div>

        <div className="flex flex-col md:items-end items-center gap-2">
          <p className="font-body text-sm text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} Avendaño Serrano Abogados S. L. P. {t("footer.rights")}
          </p>
          <button onClick={openCookieSettings} className="font-body text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            {t("footer.cookies")}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
