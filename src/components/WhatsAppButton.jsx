import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data/paellas';

const WhatsAppButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-72"
                    >
                        <div className="bg-[#25D366] p-4 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">¿Tienes alguna duda?</h3>
                                <p className="text-xs text-white/90">Escríbenos por WhatsApp</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 flex flex-col gap-3">
                            <p className="text-sm text-gray-600">
                                Los pedidos se realizan directamente <strong>a través de la web</strong> pulsando en el botón "Pedir".
                                <br/><br/>
                                Si tienes alguna alergia especial o consulta que no puedas resolver en la web, pregúntanos por aquí.
                            </p>
                            <a
                                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Abrir chat
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform relative z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Abrir ayuda de WhatsApp"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
                
                {/* Ping animation behind button */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
                )}
            </motion.button>
        </div>
    );
};

export default WhatsAppButton;
