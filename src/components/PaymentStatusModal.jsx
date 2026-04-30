import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

const PaymentStatusModal = () => {
    const [status, setStatus] = useState(null); // 'success', 'error', or null

    useEffect(() => {
        // Read URL parameters when component mounts
        const params = new URLSearchParams(window.location.search);
        const paymentParam = params.get('payment');
        
        if (paymentParam === 'success' || paymentParam === 'error') {
            setStatus(paymentParam);
            // Optional: clean up the URL without causing a full page reload
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }, []);

    if (!status) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative"
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    <button 
                        onClick={() => setStatus(null)} 
                        className="absolute right-4 top-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="p-8 pb-10 text-center flex flex-col items-center">
                        {status === 'success' ? (
                            <>
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    >
                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                    </motion.div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Completado!</h2>
                                <p className="text-gray-500 text-sm mb-8">
                                    Hemos recibido tu pedido correctamente. Nos pondremos a cocinar muy pronto.
                                </p>
                                <button 
                                    onClick={() => setStatus(null)}
                                    className="w-full py-3.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all shadow-lg shadow-green-500/30"
                                >
                                    Volver al inicio
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    >
                                        <XCircle className="w-12 h-12 text-red-500" />
                                    </motion.div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pago denegado</h2>
                                <p className="text-gray-500 text-sm mb-8">
                                    Ha ocurrido un problema al procesar el pago con tu tarjeta. Por favor, inténtalo de nuevo.
                                </p>
                                <button 
                                    onClick={() => {
                                        setStatus(null);
                                        // Optional: trigger the order modal open again using a custom event or context, 
                                        // but for now we'll just let them click it themselves.
                                    }}
                                    className="w-full py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                                >
                                    Cerrar y volver a intentar
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PaymentStatusModal;
