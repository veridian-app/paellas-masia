import { motion } from 'framer-motion';
import { Flame, Award, Heart } from 'lucide-react';

const About = () => {
    return (
        <section id="nosotros" className="py-24 md:py-32 bg-surface-warm relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-primary text-sm font-semibold rounded-full mb-4">
                            <Heart className="w-4 h-4" /> Nuestra historia
                        </span>
                    </motion.div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* Image 1: Little Kids (Origin) */}
                    <motion.div
                        className="w-full lg:w-1/3 flex justify-center lg:justify-end"
                        initial={{ opacity: 0, x: -50, rotate: -3 }}
                        whileInView={{ opacity: 1, x: 0, rotate: -3 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative p-2 bg-white shadow-xl rounded-2xl transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500 group">
                            <img
                                src="/imagenes/xuso-ubeda-chiquitos.png"
                                alt="Pablo y Giuseppe de pequeños"
                                className="w-56 h-auto md:w-72 rounded-xl filter sepia-[.2] group-hover:sepia-0 transition-all duration-500"
                            />
                            <div className="absolute -bottom-3 -right-3 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                📸 2008
                            </div>
                            <div className="text-center mt-3 text-gray-500 text-xs italic pb-1">
                                Donde todo empezó
                            </div>
                        </div>
                    </motion.div>

                    {/* Text Content */}
                    <motion.div
                        className="w-full lg:w-1/3 text-center lg:text-left flex flex-col gap-5"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display leading-tight">
                            Más que vecinos, <br />
                            <span className="gradient-text">una familia.</span>
                        </h2>

                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                Somos <span className="font-bold text-gray-800">Pablo y Giuseppe</span>, dos vecinos de Masía de Traver,
                                jóvenes emprendedores y apasionados por el arroz y la cocina bien hecha.
                            </p>
                            <p>
                                Estamos estudiando <strong>LEINN</strong>, una carrera basada en la creación de proyectos reales,
                                con el objetivo constante de mejorar, aprender y ofrecer la mejor experiencia posible.
                            </p>
                            <p>
                                Hemos gestionado cuadros bares especializados en arroces, lo que ha reforzado aún más nuestra vocación.
                                La metodología LEINN nos ha acompañado en este proceso, ayudándonos a crecer y perfeccionar
                                cada plato que cocinamos.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 justify-center lg:justify-start mt-2">
                            <div className="text-center">
                                <div className="flex items-center gap-1 text-primary mb-1">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">100%</span>
                                <p className="text-xs text-gray-500">Fuego real</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center gap-1 text-accent mb-1">
                                    <Award className="w-4 h-4" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">Km0</span>
                                <p className="text-xs text-gray-500">Ingredientes</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Image 2: Grown Ups (Present) */}
                    <motion.div
                        className="w-full lg:w-1/3 flex justify-center lg:justify-start"
                        initial={{ opacity: 0, x: 50, rotate: 3 }}
                        whileInView={{ opacity: 1, x: 0, rotate: 3 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="relative p-2 bg-white shadow-xl rounded-2xl transform rotate-[3deg] hover:rotate-0 transition-transform duration-500 group">
                            <img
                                src="/imagenes/xuso-ubeda-mayores.png"
                                alt="Pablo y Giuseppe hoy"
                                className="w-56 h-auto md:w-72 rounded-xl group-hover:brightness-110 transition-all duration-500"
                            />
                            <div className="absolute -bottom-3 -left-3 bg-accent text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                🥘 Hoy
                            </div>
                            <div className="text-center mt-3 text-gray-500 text-xs italic pb-1">
                                Pasión por el arroz
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default About;
