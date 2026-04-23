import {
  Scale, Home, Users, Briefcase, FileText, Shield, Car, Landmark, Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const serviceKeys = [
  { key: "extranjeria", icon: Globe },
  { key: "civil", icon: Scale },
  { key: "laboral", icon: Briefcase },
  { key: "familia", icon: Users },
  { key: "penal", icon: Landmark },
  { key: "inmobiliario", icon: Home },
  { key: "administrativo", icon: FileText },
  { key: "mercantil", icon: Shield },
  { key: "trafico", icon: Car },
];

const Services = () => {
  const { t } = useTranslation();
  return (
    <section id="servicios" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">{t("services.tagline")}</span>
            <div className="w-8 h-[2px] bg-highlight" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceKeys.map((service) => (
            <div
              key={service.key}
              className="group bg-card border border-border hover:border-highlight/40 rounded-lg p-7 transition-all duration-300 hover:shadow-lg hover:shadow-highlight/5"
            >
              <div className="w-12 h-12 rounded-lg bg-navy-deep flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <service.icon className="w-6 h-6 text-highlight-light" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {t(`services.items.${service.key}.title`)}
              </h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {t(`services.items.${service.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
