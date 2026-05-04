import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Instagram, Clock } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-gray-950 text-white overflow-hidden">
            {/* Decorative top wave */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-1"
                    >
                        <img
                            src="/images/logo-transparent.png"
                            alt="Arroces Masía"
                            className="h-16 w-auto mb-4 brightness-0 invert"
                        />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Arroces artesanales a domicilio. 
                            Te los llevamos a casa y luego los recogemos. Ingredientes Km0 y cocinados con pasión.
                        </p>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-lg font-bold mb-4 text-white">Contacto</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="tel:+34615614695" className="flex items-center gap-3 text-gray-400 hover:text-accent transition-colors group">
                                    <Phone className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                                    <span className="text-sm">+34 615 614 695</span>
                                </a>
                            </li>
                            <li>
                                <a href="mailto:info@arrocesmasia.com" className="flex items-center gap-3 text-gray-400 hover:text-accent transition-colors group">
                                    <Mail className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                                    <span className="text-sm">info@arrocesmasia.com</span>
                                </a>
                            </li>
                            <li>
                                <div className="flex items-start gap-3 text-gray-400">
                                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <span className="text-sm">Zona noroeste de Valencia<br />Radio 15 km desde Entrenaranjos</span>
                                </div>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Hours */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-lg font-bold mb-4 text-white">Horario de Entrega</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-400">
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <div className="text-sm">
                                    <span className="text-white font-medium">Sábados y Domingos</span>
                                    <br />12:45 — 15:45
                                </div>
                            </li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                            * Margen de entrega ±10 minutos sobre la hora seleccionada
                        </p>
                    </motion.div>

                    {/* Social */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-lg font-bold mb-4 text-white">Síguenos</h3>
                        <div className="flex gap-3">
                            <a
                                href="https://www.instagram.com/arrocesmasia/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 hover:bg-primary text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                        <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                🥘 ¿Más de 25 comensales?
                                <br />
                                <a href="https://wa.me/34615614695" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                                    Contáctanos por WhatsApp
                                </a>
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                        © {currentYear} Arroces Masía. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Hecho con 🔥 y mucho arroz</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
