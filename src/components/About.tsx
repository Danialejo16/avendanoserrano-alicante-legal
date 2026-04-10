import { Award, Clock, TrendingUp, Heart } from "lucide-react";

const values = [
  { icon: Heart, title: "Compromiso", desc: "Cada caso es tratado con dedicación y rigor profesional." },
  { icon: Clock, title: "Disponibilidad", desc: "Atención ágil y respuesta inmediata cuando nos necesite." },
  { icon: TrendingUp, title: "Precios Competitivos", desc: "Los mejores precios de Alicante sin renunciar a la excelencia." },
  { icon: Award, title: "Resultados", desc: "Orientados a obtener el mejor resultado para nuestros clientes." },
];

const About = () => {
  return (
    <section id="nosotros" className="section-padding bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-gold" />
              <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">Sobre nosotros</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Un despacho que crece con usted
            </h2>
            <div className="space-y-4 font-body text-base leading-relaxed text-primary-foreground/75">
              <p>
                <strong className="text-gold">Avendaño Serrano Abogados</strong> nace con la vocación de ofrecer
                un servicio jurídico cercano, eficaz y a precios justos en la provincia de Alicante.
              </p>
              <p>
                Aunque actualmente somos un despacho unipersonal, nuestra visión es clara: crecer incorporando
                a los mejores profesionales para seguir ofreciendo un trato personalizado con la capacidad de un
                gran bufete.
              </p>
              <p>
                Creemos que el acceso a una defensa legal de calidad no debería ser un lujo. Por eso ofrecemos
                los precios más competitivos de la zona, con primera consulta gratuita.
              </p>
            </div>
          </div>

          {/* Right - Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-primary-foreground/10 border border-gold/15 rounded-lg p-6">
                <v.icon className="w-8 h-8 text-gold mb-4" />
                <h3 className="font-heading text-lg font-semibold text-primary-foreground mb-2">
                  {v.title}
                </h3>
                <p className="font-body text-sm text-primary-foreground/60">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
