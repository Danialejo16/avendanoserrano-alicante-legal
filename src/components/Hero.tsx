import heroImage from "@/assets/hero-law.jpg";

const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Despacho de abogados" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy-deep/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20 pt-20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-12 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">
              Abogados en Alicante
            </span>
          </div>

          <h1
            className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-primary-foreground mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.3s", opacity: 0 }}
          >
            Defendemos sus derechos con{" "}
            <span className="text-highlight-light italic">compromiso</span> y{" "}
            <span className="text-highlight-light italic">excelencia</span>
          </h1>

          <p
            className="text-lg md:text-xl font-body leading-relaxed text-primary-foreground/70 mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}
          >
            Todos los servicios jurídicos que necesita con los precios más
            competitivos de Alicante. Atención personalizada y resultados.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.7s", opacity: 0 }}
          >
            <a
              href="#contacto"
              className="accent-gradient text-accent-foreground px-8 py-4 rounded text-base font-semibold hover:opacity-90 transition-opacity text-center"
            >
              Consulta gratuita
            </a>
            <a
              href="#servicios"
              className="border border-highlight/40 text-primary-foreground px-8 py-4 rounded text-base font-semibold hover:bg-highlight/10 transition-colors text-center"
            >
              Nuestros servicios
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
