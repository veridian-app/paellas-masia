import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Flame, Filter } from 'lucide-react';
import { PAELLAS, CATEGORIES, getMinPrice } from '../data/paellas';

const Products = ({ onOpenOrder }) => {
    const [activeFilter, setActiveFilter] = useState('all');

    const filtered = activeFilter === 'all'
        ? PAELLAS
        : PAELLAS.filter(p => p.category === activeFilter);

    return (
        <section id="carta" className="py-20 md:py-28 bg-white relative overflow-hidden">
            {/* Subtle bg decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-50 rounded-full -translate-y-1/2 blur-3xl opacity-30" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50 text-primary text-sm font-semibold rounded-full mb-4">
                            <Flame className="w-4 h-4" /> Nuestra Carta
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
                            Arroces Artesanales
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                            Cada plato, una experiencia única. Te los llevamos a casa y luego los recogemos. Solo ingredientes frescos de la huerta valenciana.
                        </p>
                    </motion.div>
                </div>

                {/* Category filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center justify-center gap-2 mb-10 flex-wrap"
                >
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                activeFilter === key
                                    ? 'bg-primary text-white shadow-lg shadow-red-500/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </motion.div>

                {/* Product Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filtered.map((product, index) => (
                        <motion.div
                            key={product.id}
                            className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                            layout
                        >
                            {/* Image */}
                            <div className="relative aspect-square overflow-hidden bg-gray-50/50 flex items-center justify-center">
                                <img
                                    src={product.src}
                                    alt={product.title}
                                    className={`w-[90%] h-[90%] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 ${product.blend ? 'mix-blend-multiply' : ''}`}
                                    loading="lazy"
                                />
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Category badge */}
                                {product.category === 'premium' && (
                                    <div className="absolute top-2 right-2 md:top-3 md:right-3 px-2 py-1 bg-gold/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold rounded-full">
                                        ⭐ Premium
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-3 md:p-5 flex flex-col gap-1.5 md:gap-2">
                                <h3 className="text-sm md:text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                                    {product.title}
                                </h3>

                                <p className="text-gray-400 text-xs md:text-sm line-clamp-2 leading-relaxed hidden sm:block">
                                    {product.description}
                                </p>

                                {/* Allergens (desktop only) */}
                                <div className="hidden md:flex flex-wrap gap-1 mb-1">
                                    {product.allergens?.map((al, i) => (
                                        <span key={i} className="text-[10px] bg-red-50 border border-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                            {al}
                                        </span>
                                    ))}
                                </div>

                                {/* Price + CTA */}
                                <div className="mt-auto pt-2 md:pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-gray-400 text-[10px] md:text-xs">desde </span>
                                        <span className="font-bold text-lg md:text-xl text-primary">{getMinPrice(product)}€</span>
                                        <span className="text-gray-400 text-[10px] md:text-xs block">/persona</span>
                                    </div>
                                    <button
                                        onClick={() => onOpenOrder(product.id)}
                                        className="flex items-center gap-1 text-xs md:text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors bg-gray-50 group-hover:bg-red-50 px-3 py-1.5 rounded-full"
                                    >
                                        Pedir
                                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Products;
