import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Phone } from 'lucide-react';

const NAV_LINKS = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Carta', href: '#carta' },
    { label: 'Zona de Reparto', href: '#zona' },
    { label: 'Nosotros', href: '#nosotros' },
];

const Navbar = ({ onOpenOrder }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLinkClick = (e, href) => {
        e.preventDefault();
        setMobileOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`fixed top-0 left-0 right-0 z-[90] transition-all duration-500 ${
                    scrolled
                        ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-100/50'
                        : 'bg-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <a href="#inicio" className="flex items-center gap-3 group">
                            <img
                                src="/images/logo-transparent.png"
                                alt="Arroces Masía"
                                className="h-10 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        </a>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => handleLinkClick(e, link.href)}
                                    className={`text-sm font-medium animated-underline transition-colors duration-300 ${
                                        scrolled ? 'text-gray-700 hover:text-primary' : 'text-gray-800 hover:text-primary'
                                    }`}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <button
                                onClick={onOpenOrder}
                                className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:bg-primary-dark transition-all duration-300 hover:scale-105"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                Pedir Ahora
                            </button>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[85] bg-black/30 backdrop-blur-sm md:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu Panel */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-[95] bg-white shadow-2xl md:hidden"
                    >
                        <div className="flex flex-col h-full p-6 pt-20">
                            <div className="flex flex-col gap-2">
                                {NAV_LINKS.map((link, i) => (
                                    <motion.a
                                        key={link.href}
                                        href={link.href}
                                        onClick={(e) => handleLinkClick(e, link.href)}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="text-lg font-medium text-gray-800 hover:text-primary py-3 px-4 rounded-xl hover:bg-red-50 transition-all duration-200"
                                    >
                                        {link.label}
                                    </motion.a>
                                ))}
                            </div>

                            <div className="mt-auto space-y-3">
                                <button
                                    onClick={() => { setMobileOpen(false); onOpenOrder(); }}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl text-base font-bold shadow-lg shadow-red-500/25 hover:bg-primary-dark transition-all"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    Pedir Ahora
                                </button>
                                <a
                                    href="tel:+34717771734"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl text-base font-medium hover:border-primary hover:text-primary transition-all"
                                >
                                    <Phone className="w-5 h-5" />
                                    Llamar
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
