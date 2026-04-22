import { useEffect, useState } from "react";
import { Phone, Mail, X, ChevronDown } from "lucide-react";

const STORAGE_KEY = "top-contact-bar-hidden";
const PHONE = "+34 645 04 16 64";
const PHONE_HREF = "tel:+34645041664";
const EMAIL = "info@avendanoserrano.es";

const TopContactBar = () => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const hide = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
  };

  const show = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHidden(false);
  };

  if (hidden) {
    return (
      <button
        onClick={show}
        aria-label="Mostrar barra de contacto"
        className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-navy-deep text-primary-foreground px-3 py-1 rounded-b-md text-xs flex items-center gap-1 shadow-md hover:opacity-90 transition-opacity"
      >
        <ChevronDown className="w-3 h-3" />
        Contacto
      </button>
    );
  }

  return (
    <div className="bg-navy-deep text-primary-foreground text-xs md:text-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-9 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
          <a
            href={PHONE_HREF}
            className="flex items-center gap-1.5 hover:text-highlight-light transition-colors whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="font-body">{PHONE}</span>
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="hidden sm:flex items-center gap-1.5 hover:text-highlight-light transition-colors whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="font-body">{EMAIL}</span>
          </a>
        </div>
        <button
          onClick={hide}
          aria-label="Ocultar barra de contacto"
          className="p-1 hover:text-highlight-light transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TopContactBar;
