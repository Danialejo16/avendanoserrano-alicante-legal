import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Phone, Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const PHONE = "+34645041664";

const TOPIC_IDS = ["familia", "penal", "civil", "laboral", "extranjeria", "mercantil", "otro"] as const;
type TopicId = (typeof TOPIC_IDS)[number];

type Message = {
  role: "bot" | "user";
  content: string;
};

const STORAGE_KEY = "legal-chat-hidden";

const LegalChatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset greeting on language change
  useEffect(() => {
    setMessages([{ role: "bot", content: t("chat.greeting") }]);
    setSelectedTopic(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const WHATSAPP_URL = `https://wa.me/34645041664?text=${encodeURIComponent(t("chat.whatsappMessage"))}`;

  const handleHide = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
    setOpen(false);
  };

  const handleTopic = (id: TopicId) => {
    setSelectedTopic(id);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: t(`chat.topics.${id}.label`) },
      { role: "bot", content: t(`chat.topics.${id}.answer`) },
      { role: "bot", content: t("chat.continue") },
    ]);
  };

  const handleReset = () => {
    setSelectedTopic(null);
    setMessages([{ role: "bot", content: t("chat.anotherIntro") }]);
  };

  const handleGoToContact = () => {
    setOpen(false);
    if (location.pathname === "/") {
      document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/", { state: { scrollTo: "contacto" } });
    }
  };

  if (hidden) return null;

  return (
    <>
      {!open && (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label={t("chat.openAria")}
            className="group relative flex items-center gap-2 bg-navy-deep text-primary-foreground pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <span className="absolute inset-0 rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            <MessageCircle className="w-5 h-5 text-highlight-light group-hover:text-accent-foreground transition-colors" />
            <span className="font-body text-sm font-semibold hidden sm:inline">
              {t("chat.open")}
            </span>
          </button>
          <button
            onClick={handleHide}
            className="text-[10px] text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border transition-colors"
            aria-label={t("chat.hideAria")}
          >
            {t("chat.hide")}
          </button>
        </div>
      )}

      {open && (
        <div
          className={cn(
            "fixed z-[60] bg-card border border-border shadow-2xl flex flex-col overflow-hidden",
            "bottom-0 right-0 left-0 h-[85vh] rounded-t-2xl",
            "sm:bottom-6 sm:right-6 sm:left-auto sm:h-[560px] sm:w-[380px] sm:rounded-2xl"
          )}
        >
          <div className="bg-navy-deep text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm leading-tight">{t("chat.title")}</p>
                <p className="text-xs text-highlight-light leading-tight">{t("chat.subtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t("chat.close")}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === "bot" ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed",
                    msg.role === "bot"
                      ? "bg-card border border-border text-foreground rounded-tl-sm"
                      : "bg-navy-deep text-primary-foreground rounded-tr-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {!selectedTopic && (
              <div className="flex flex-wrap gap-2 pt-2">
                {TOPIC_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => handleTopic(id)}
                    className="text-xs font-body px-3 py-1.5 rounded-full border border-highlight/40 text-highlight hover:bg-highlight hover:text-accent-foreground transition-colors"
                  >
                    {t(`chat.topics.${id}.label`)}
                  </button>
                ))}
              </div>
            )}

            {selectedTopic && (
              <div className="pt-1">
                <button
                  onClick={handleReset}
                  className="text-xs font-body inline-flex items-center gap-1.5 text-muted-foreground hover:text-highlight transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> {t("chat.another")}
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 bg-card space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body text-center">
              {t("chat.contactUs")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleGoToContact}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-highlight hover:bg-highlight/5 transition-colors"
              >
                <Mail className="w-4 h-4 text-highlight" />
                <span className="text-[11px] font-body font-medium text-foreground">{t("chat.form")}</span>
              </button>
              <a
                href={`tel:${PHONE}`}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-highlight hover:bg-highlight/5 transition-colors"
              >
                <Phone className="w-4 h-4 text-highlight" />
                <span className="text-[11px] font-body font-medium text-foreground">{t("chat.call")}</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-highlight hover:bg-highlight/5 transition-colors"
              >
                <svg className="w-4 h-4 text-highlight" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-[11px] font-body font-medium text-foreground">{t("chat.whatsapp")}</span>
              </a>
            </div>
            <button
              onClick={handleHide}
              className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              {t("chat.hidePermanent")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LegalChatbot;
