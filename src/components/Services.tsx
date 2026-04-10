import {
  Scale, Home, Users, Briefcase, FileText, Shield, Car, Landmark, Globe,
} from "lucide-react";

const services = [
  { icon: Globe, title: "Derecho de Extranjería", desc: "Permisos de residencia, visados, nacionalidad, arraigo y reagrupación familiar." },
  { icon: Scale, title: "Derecho Civil", desc: "Contratos, reclamaciones, herencias, responsabilidad civil y más." },
  { icon: Briefcase, title: "Derecho Laboral", desc: "Despidos, indemnizaciones, ERTEs y negociación colectiva." },
  { icon: Users, title: "Derecho de Familia", desc: "Divorcios, custodia, pensiones y régimen de visitas." },
  { icon: Landmark, title: "Derecho Penal", desc: "Defensa penal, denuncias, juicios rápidos y recursos." },
  { icon: Home, title: "Derecho Inmobiliario", desc: "Compraventas, arrendamientos, comunidades de propietarios." },
  { icon: FileText, title: "Derecho Administrativo", desc: "Recursos, sanciones, licencias y relaciones con la administración." },
  { icon: Shield, title: "Derecho Mercantil", desc: "Constitución de sociedades, contratos mercantiles y concursos." },
  { icon: Car, title: "Accidentes de Tráfico", desc: "Reclamaciones a seguros, indemnizaciones y lesiones." },
];

const Services = () => {
  return (
    <section id="servicios" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">Áreas de práctica</span>
            <div className="w-8 h-[2px] bg-highlight" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Servicios Jurídicos Integrales
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
            Ofrecemos asesoramiento legal completo con los precios más competitivos de Alicante, sin renunciar a la calidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group bg-card border border-border hover:border-highlight/40 rounded-lg p-7 transition-all duration-300 hover:shadow-lg hover:shadow-highlight/5"
            >
              <div className="w-12 h-12 rounded-lg bg-navy-deep flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <service.icon className="w-6 h-6 text-highlight-light" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
