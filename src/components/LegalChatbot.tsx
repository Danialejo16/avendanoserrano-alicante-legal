import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, X, Phone, Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const PHONE = "+34645041664";
const PHONE_DISPLAY = "+34 645 041 664";
const WHATSAPP_URL = `https://wa.me/34645041664?text=${encodeURIComponent(
  "Hola, me gustaría recibir asesoramiento legal."
)}`;

type Topic = {
  id: string;
  label: string;
  answer: string;
};

const TOPICS: Topic[] = [
  {
    id: "familia",
    label: "Derecho de Familia",
    answer:
      "Asesoramos en divorcios, separaciones, custodia de menores, pensiones de alimentos y modificaciones de medidas. Cada caso familiar es único y requiere una estrategia personalizada para proteger sus intereses y los de sus seres queridos.",
  },
  {
    id: "penal",
    label: "Derecho Penal",
    answer:
      "Le defendemos en cualquier procedimiento penal: delitos contra la seguridad vial, lesiones, delitos económicos, violencia doméstica y más. Asistencia 24h en comisaría y juzgados de guardia.",
  },
  {
    id: "civil",
    label: "Derecho Civil",
    answer:
      "Reclamaciones de cantidad, contratos, herencias, desahucios, responsabilidad civil y derechos reales. Resolvemos conflictos civiles buscando siempre la solución más eficiente para usted.",
  },
  {
    id: "laboral",
    label: "Derecho Laboral",
    answer:
      "Despidos, reclamaciones de salarios, accidentes laborales, incapacidades, acoso laboral y negociación colectiva. Defendemos sus derechos como trabajador o asesoramos a su empresa.",
  },
  {
    id: "extranjeria",
    label: "Extranjería",
    answer:
      "Permisos de residencia, nacionalidad española, reagrupación familiar, recursos contra denegaciones y arraigos. Le acompañamos en todo el proceso administrativo.",
  },
  {
    id: "mercantil",
    label: "Derecho Mercantil",
    answer:
      "Constitución de sociedades, contratos mercantiles, reclamaciones entre empresas, concursos de acreedores y asesoramiento continuado a empresas y autónomos.",
  },
  {
    id: "otro",
    label: "Otra consulta",
    answer:
      "Atendemos cualquier consulta legal. Contacte con nosotros y le diremos cómo podemos ayudarle. La primera consulta es siempre gratuita y sin compromiso.",
  },
];

type Message = {
  role: "bot" | "user";
  content: string;
};

const STORAGE_KEY = "legal-chat-hidden";

const LegalChatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "¡Hola! Soy el asistente virtual de Avendaño Serrano Abogados. ¿Sobre qué tema legal le gustaría informarse?",
    },
  ]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleHide = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
    setOpen(false);
  };

  const handleTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: topic.label },
      { role: "bot", content: topic.answer },
      {
        role: "bot",
        content: "¿Cómo prefiere continuar? Puede contactarnos directamente o explorar otro tema.",
      },
    ]);
  };

  const handleReset = () => {
    setSelectedTopic(null);
    setMessages([
      {
        role: "bot",
        content: "Por supuesto. ¿Sobre qué otro tema legal le gustaría informarse?",
      },
    ]);
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
      {/* Floating button */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir asistente legal"
            className="group relative flex items-center gap-2 bg-navy-deep text-primary-foreground pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <span className="absolute inset-0 rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            <MessageCircle className="w-5 h-5 text-highlight-light group-hover:text-accent-foreground transition-colors" />
            <span className="font-body text-sm font-semibold hidden sm:inline">
              ¿Necesita ayuda legal?
            </span>
          </button>
          <button
            onClick={handleHide}
            className="text-[10px] text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border transition-colors"
            aria-label="Ocultar asistente"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-[60] bg-card border border-border shadow-2xl flex flex-col overflow-hidden",
            "bottom-0 right-0 left-0 h-[85vh] rounded-t-2xl",
            "sm:bottom-6 sm:right-6 sm:left-auto sm:h-[560px] sm:w-[380px] sm:rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="bg-navy-deep text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full accent-gradient flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm leading-tight">Asistente Legal</p>
                <p className="text-xs text-highlight-light leading-tight">Avendaño Serrano Abogados</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "bot" ? "justify-start" : "justify-end"
                )}
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

            {/* Topic buttons */}
            {!selectedTopic && (
              <div className="flex flex-wrap gap-2 pt-2">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopic(topic)}
                    className="text-xs font-body px-3 py-1.5 rounded-full border border-highlight/40 text-highlight hover:bg-highlight hover:text-accent-foreground transition-colors"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            )}

            {/* Reset option */}
            {selectedTopic && (
              <div className="pt-1">
                <button
                  onClick={handleReset}
                  className="text-xs font-body inline-flex items-center gap-1.5 text-muted-foreground hover:text-highlight transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> Consultar otro tema
                </button>
              </div>
            )}
          </div>

          {/* Action footer */}
          <div className="border-t border-border p-3 bg-card space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-body text-center">
              Contacte con nosotros
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleGoToContact}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-highlight hover:bg-highlight/5 transition-colors"
              >
                <Mail className="w-4 h-4 text-highlight" />
                <span className="text-[11px] font-body font-medium text-foreground">Formulario</span>
              </button>
              <a
                href={`tel:${PHONE}`}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-highlight hover:bg-highlight/5 transition-colors"
              >
                <Phone className="w-4 h-4 text-highlight" />
                <span className="text-[11px] font-body font-medium text-foreground">Llamar</span>
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
                <span className="text-[11px] font-body font-medium text-foreground">WhatsApp</span>
              </a>
            </div>
            <button
              onClick={handleHide}
              className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              Ocultar asistente permanentemente
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LegalChatbot;
