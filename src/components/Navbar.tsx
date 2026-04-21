import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const links = [
    { label: "Inicio", href: isHome ? "#inicio" : "/#inicio" },
    { label: "Servicios", href: isHome ? "#servicios" : "/#servicios" },
    { label: "Sobre Nosotros", href: isHome ? "#nosotros" : "/#nosotros" },
    { label: "Currículum", href: "/curriculum" },
    { label: "Blog", href: "/blog" },
    { label: "Contacto", href: isHome ? "#contacto" : "/#contacto" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
        <Link to="/">
          <img src={logo} alt="Avendaño Serrano Abogados" className="h-12 md:h-14 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) =>
            link.href.startsWith("/") && !link.href.includes("#") ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-foreground/70 hover:text-highlight transition-colors tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-highlight transition-colors tracking-wide uppercase"
              >
                {link.label}
              </a>
            )
          )}
          <a
            href="tel:+34 645041664"
            className="flex items-center gap-2 bg-navy-deep text-primary-foreground px-5 py-2.5 rounded text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="w-4 h-4" />
            Llamar ahora
          </a>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-t border-border px-6 pb-6">
          {links.map((link) =>
            link.href.startsWith("/") && !link.href.includes("#") ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-foreground/70 hover:text-highlight transition-colors text-sm uppercase tracking-wide"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-foreground/70 hover:text-highlight transition-colors text-sm uppercase tracking-wide"
              >
                {link.label}
              </a>
            )
          )}
          <a
            href="tel:+34 600 000 00"
            className="mt-3 flex items-center justify-center gap-2 bg-navy-deep text-primary-foreground px-5 py-2.5 rounded text-sm font-semibold"
          >
            <Phone className="w-4 h-4" />
            Llamar ahora
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
