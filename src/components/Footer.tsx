import { Facebook, Instagram, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import { openCookieSettings } from "@/lib/cookies";

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/danialejoserrano", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/_danialejo_", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-secondary border-t border-border py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <img src={logo} alt="Avendaño Serrano Abogados" className="h-10 w-auto" />

        <div className="flex items-center gap-4">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-primary-foreground hover:bg-highlight transition-colors"
            >
              <s.icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        <div className="flex flex-col md:items-end items-center gap-2">
          <p className="font-body text-sm text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} Avendaño Serrano Abogados. {t("footer.rights")}
          </p>
          <button
            onClick={openCookieSettings}
            className="font-body text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {t("footer.cookies")}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
