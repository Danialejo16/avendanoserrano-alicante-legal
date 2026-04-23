import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";
import TopContactBar from "./TopContactBar";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { t } = useTranslation();

  const sectionLinks = [
    { label: t("nav.home"), id: "inicio" },
    { label: t("nav.services"), id: "servicios" },
    { label: t("nav.about"), id: "nosotros" },
    { label: t("nav.contact"), id: "contacto" },
  ];

  const pageLinks = [
    { label: t("nav.curriculum"), href: "/curriculum" },
    { label: t("nav.blog"), href: "/blog" },
  ];

  const handleSectionClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setIsOpen(false);
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  const orderedLinks = [
    sectionLinks[0],
    sectionLinks[1],
    sectionLinks[2],
    pageLinks[0],
    pageLinks[1],
    sectionLinks[3],
  ];

  const renderLink = (link: typeof orderedLinks[number], mobile = false) => {
    const baseClass = mobile
      ? "block py-3 text-foreground/70 hover:text-highlight transition-colors text-sm uppercase tracking-wide"
      : "text-sm text-foreground/70 hover:text-highlight transition-colors tracking-wide uppercase";

    if ("href" in link) {
      return (
        <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className={baseClass}>
          {link.label}
        </Link>
      );
    }
    return (
      <a
        key={link.id}
        href={isHome ? `#${link.id}` : `/#${link.id}`}
        onClick={(e) => handleSectionClick(e, link.id)}
        className={baseClass}
      >
        {link.label}
      </a>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <TopContactBar />
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
        <Link to="/">
          <img src={logo} alt="Avendaño Serrano Abogados" className="h-12 md:h-14 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {orderedLinks.map((link) => renderLink(link))}
          <LanguageSwitcher />
          <a
            href="tel:+34 645041664"
            className="flex items-center gap-2 bg-navy-deep text-primary-foreground px-5 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="w-4 h-4" />
            {t("nav.callNow")}
          </a>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-t border-border px-6 pb-6">
          {orderedLinks.map((link) => renderLink(link, true))}
          <div className="py-3 border-t border-border mt-2">
            <LanguageSwitcher />
          </div>
          <a
            href="tel:+34 645041664"
            className="mt-3 flex items-center justify-center gap-2 bg-navy-deep text-primary-foreground px-5 py-2.5 rounded text-sm font-semibold"
          >
            <Phone className="w-4 h-4" />
            {t("nav.callNow")}
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
