import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ChevronDown } from 'lucide-react';
import PaellaCard from './PaellaCard';
import { PAELLAS } from '../data/paellas';

const HERO_IMAGES = [
    '/images/paellas-nobg/valenciana.png',
    '/images/paellas-nobg/marisco.png',
    '/images/paellas-nobg/entrecot.png',
    '/images/paellas-nobg/carabineros.png',
    '/images/paellas-nobg/senyoret.png',
];

const Hero = ({ onOpenOrder }) => {
    const rotation = useMotionValue(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [selectedPaella, setSelectedPaella] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Background slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex(prev => (prev + 1) % HERO_IMAGES.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    // Auto-rotate carousel
    useEffect(() => {
        if (isAutoPlaying && !selectedPaella) {
            const interval = setInterval(() => {
                const current = rotation.get();
                const target = Math.round(current) + 1;
                animate(rotation, target, { duration: 1.5, ease: "easeInOut" });
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [isAutoPlaying, selectedPaella]);

    const timeoutRef = useRef(null);

    const handleWheel = (e) => {
        if (selectedPaella) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;
        setIsAutoPlaying(false);
        rotation.stop();
        const current = rotation.get();
        const newRotation = current - (delta * 0.005);
        rotation.set(newRotation);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => snapToNearest(), 150);
    };

    const handlePan = (_, info) => {
        if (selectedPaella) return;
        setIsAutoPlaying(false);
        rotation.stop();
        const delta = info.delta.x;
        const current = rotation.get();
        rotation.set(current - (delta * 0.005));
    };

    const handlePanEnd = () => snapToNearest();

    const snapToNearest = () => {
        const finalP = rotation.get();
        const target = Math.round(finalP);
        animate(rotation, target, { type: "spring", stiffness: 200, damping: 25 });
        setIsAutoPlaying(true);
    };

    return (
        <section id="inicio" className="relative w-full min-h-screen flex flex-col items-center justify-start pt-20 md:pt-28 pb-20 overflow-hidden">

            {/* Animated background images */}
            <div className="absolute inset-0 -z-20">
                {HERO_IMAGES.map((img, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 transition-opacity duration-[2000ms]"
                        style={{ opacity: bgIndex === i ? 0.15 : 0 }}
                    >
                        <img src={img} alt="" className="w-full h-full object-cover scale-110 blur-sm" />
                    </div>
                ))}
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/90 via-background/70 to-background" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent -z-10" />

            {/* Decorative elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-40 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

            {/* Hero Content */}
            <div className="container mx-auto px-4 z-20 flex flex-col items-center text-center mb-0 relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="flex flex-col items-center mb-6"
                >
                    <motion.img
                        src="/images/logo-transparent.png"
                        alt="Arroces Masía"
                        className="w-full max-w-xs md:max-w-2xl h-auto object-contain -mt-24 -mb-28 md:-mt-56 md:-mb-48"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    />

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-4">
                        <span className="font-display">Arroces Tradicionales e Innovadores</span>
                        <br />
                        <span className="relative inline-block gradient-text">
                            Directos a Tu Mesa
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="6" fill="transparent" />
                            </svg>
                        </span>
                    </h1>

                    <p className="text-gray-500 text-lg md:text-xl max-w-xl leading-relaxed mb-6">
                        Hechos con pasión y los mejores ingredientes Km0. Entrega a domicilio en la zona noroeste de Valencia.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <motion.button
                            onClick={onOpenOrder}
                            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full text-base font-bold shadow-xl shadow-red-500/25 overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="relative z-10">Pedir Ahora</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.button>
                        <motion.a
                            href="#carta"
                            className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-primary font-medium transition-colors"
                            whileHover={{ scale: 1.02 }}
                        >
                            Ver Carta
                            <ChevronDown className="w-4 h-4" />
                        </motion.a>
                    </div>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="flex items-center gap-6 text-sm text-gray-400 mt-2 mb-8"
                >
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <span>Km0</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>🔥 Cocinado al momento</span>
                    <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block" />
                    <span className="hidden sm:inline">📍 Zona noroeste Valencia</span>
                </motion.div>
            </div>

            {/* Carousel Container */}
            <motion.div
                className="relative w-full flex-grow flex items-center justify-center perspective-1000 -mt-10 md:mt-0 z-30 touch-pan-y"
                onWheel={handleWheel}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
            >
                <div className="relative w-full h-[300px] md:h-[500px] flex items-center justify-center pointer-events-none">
                    {PAELLAS.map((paella, index) => (
                        <PaellaCard
                            key={paella.id}
                            item={paella}
                            index={index}
                            rotation={rotation}
                            count={PAELLAS.length}
                            radiusX={isMobile ? 140 : 380}
                            radiusY={isMobile ? 40 : 90}
                            onSelect={() => setSelectedPaella(paella)}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedPaella && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPaella(null)}
                    >
                        <motion.div
                            className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-lg w-full relative overflow-hidden"
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Decorative gradient */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                            <button
                                onClick={() => setSelectedPaella(null)}
                                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                            >
                                ✕
                            </button>

                            <div className="flex flex-col items-center gap-5">
                                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-white flex items-center justify-center p-4">
                                    <img
                                        src={selectedPaella.src}
                                        alt={selectedPaella.title}
                                        className={`w-full h-full object-contain drop-shadow-xl ${selectedPaella.blend ? 'mix-blend-multiply' : ''}`}
                                    />
                                </div>

                                <div className="text-center w-full">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-display">{selectedPaella.title}</h2>
                                    <p className="text-gray-500 mb-4">{selectedPaella.description}</p>

                                    <div className="grid grid-cols-2 gap-4 text-left w-full bg-red-50/50 p-4 rounded-2xl mb-5">
                                        <div>
                                            <h4 className="font-bold text-primary text-xs mb-1.5 uppercase tracking-wider">Ingredientes</h4>
                                            <ul className="text-sm text-gray-700 space-y-0.5">
                                                {selectedPaella.ingredients?.map((ing, i) => (
                                                    <li key={i} className="flex items-center gap-1.5">
                                                        <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                                                        {ing}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary text-xs mb-1.5 uppercase tracking-wider">Alérgenos</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedPaella.allergens?.map((al, i) => (
                                                    <span key={i} className="text-xs bg-white border border-red-100 px-2 py-1 rounded-lg text-gray-600">{al}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs text-gray-400 uppercase tracking-wider">Precio / Ración</span>
                                            <span className="text-3xl font-bold text-primary">{selectedPaella.price}€</span>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedPaella(null); onOpenOrder(); }}
                                            className="flex-1 max-w-[200px] bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                        >
                                            🥘 Pedir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Hero;
