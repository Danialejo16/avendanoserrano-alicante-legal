import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-gold" />
            <span className="text-gold text-sm tracking-[0.3em] uppercase font-body">Contacto</span>
            <div className="w-8 h-[2px] bg-gold" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Primera consulta gratuita
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
            Cuéntenos su caso sin compromiso. Le asesoraremos sobre la mejor estrategia legal.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Info */}
          <div className="lg:col-span-2 space-y-8">
            {[
              { icon: MapPin, label: "Dirección", value: "Alicante, España" },
              { icon: Phone, label: "Teléfono", value: "+34 600 000 000" },
              { icon: Mail, label: "Email", value: "info@avendanoserrano.es" },
              { icon: Clock, label: "Horario", value: "L-V: 9:00 – 19:00" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-navy-deep flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-body">{item.label}</p>
                  <p className="font-body font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-card border border-gold/30 rounded-lg p-12 text-center">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">¡Mensaje enviado!</h3>
                <p className="text-muted-foreground font-body">Nos pondremos en contacto lo antes posible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1.5 block">Nombre</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1.5 block">Teléfono</label>
                    <input
                      type="tel"
                      required
                      className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-body text-muted-foreground mb-1.5 block">¿Cómo podemos ayudarle?</label>
                  <textarea
                    rows={5}
                    required
                    className="w-full border border-border bg-background rounded px-4 py-3 font-body text-foreground focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full gold-gradient text-accent-foreground py-3.5 rounded font-semibold text-base hover:opacity-90 transition-opacity"
                >
                  Enviar consulta gratuita
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
