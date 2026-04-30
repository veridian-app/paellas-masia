import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ShoppingBag, User, MapPin, Calendar, CreditCard, FileText,
    ChevronRight, ChevronLeft, Check, Plus, Minus, AlertCircle,
    Phone, Mail, Clock, MessageCircle, Users
} from 'lucide-react';
import { PAELLAS, TIME_SLOTS, WHATSAPP_NUMBER } from '../data/paellas';

const getPricePerPortion = (basePrice, qty) => {
    if (!qty || qty <= 3) return basePrice;
    const extras = qty - 3;
    const discountPercent = extras * 2.25;
    const exactPrice = basePrice * (1 - (discountPercent / 100));
    // Redondear al 0.25 más cercano
    return Math.round(exactPrice * 4) / 4;
};

const STEPS = [
    { id: 1, label: 'Productos', icon: ShoppingBag },
    { id: 2, label: 'Datos', icon: User },
    { id: 3, label: 'Entrega', icon: Calendar },
    { id: 4, label: 'Pago', icon: CreditCard },
    { id: 5, label: 'Resumen', icon: FileText },
];

const OrderForm = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    // cart: { [id]: number } — número de raciones por paella
    const [cart, setCart] = useState({});
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        date: '',
        time: '',
        notes: '',
        paymentMethod: '',
    });

    const totalRaciones = useMemo(() => {
        return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    }, [cart]);

    const totalPrice = useMemo(() => {
        return Object.entries(cart).reduce((sum, [id, qty]) => {
            const p = PAELLAS.find(p => p.id === id);
            if (!p) return sum;
            const price = getPricePerPortion(p.price, qty);
            return sum + (price * qty);
        }, 0);
    }, [cart]);

    const totalPaellas = useMemo(() => {
        return Object.keys(cart).length;
    }, [cart]);

    // Añadir paella al carrito con mínimo 3 raciones
    const initPaella = (id) => {
        setCart(prev => ({ ...prev, [id]: 3 }));
    };

    // Quitar una ración (si llega a 0 se elimina del carrito)
    const removeRacion = (id) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[id] > 3) {
                newCart[id]--;
            } else {
                delete newCart[id];
            }
            return newCart;
        });
    };

    // Añadir una ración
    const addRacion = (id) => {
        setCart(prev => ({
            ...prev,
            [id]: Math.min(25, (prev[id] || 3) + 1)
        }));
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const canProceed = () => {
        switch (step) {
            case 1: return totalRaciones > 0;
            case 2: return formData.name && formData.phone && formData.email && formData.address;
            case 3: return formData.date && formData.time;
            case 4: return formData.paymentMethod;
            default: return true;
        }
    };

    const buildWhatsAppMessage = () => {
        const items = Object.entries(cart).map(([id, qty]) => {
            const p = PAELLAS.find(p => p.id === id);
            if (!p) return '';
            const pricePerPortion = getPricePerPortion(p.price, qty);
            return `• ${p.title} — ${qty} raciones (${pricePerPortion}€/ración = ${pricePerPortion * qty}€)`;
        }).join('\n');

        const message =
            `🥘 *NUEVO PEDIDO — Arroces Masía*\n\n` +
            `👤 *Cliente:* ${formData.name}\n` +
            `📱 *Teléfono:* ${formData.phone}\n` +
            `📧 *Email:* ${formData.email}\n` +
            `📍 *Dirección:* ${formData.address}\n\n` +
            `📅 *Fecha:* ${formData.date}\n` +
            `🕐 *Hora de entrega:* ${formData.time} (±10 min)\n` +
            `👥 *Total raciones:* ${totalRaciones}\n\n` +
            `🍚 *Pedido:*\n${items}\n\n` +
            `💰 *Total estimado:* ${totalPrice}€\n` +
            `💳 *Método de pago:* ${formData.paymentMethod === 'efectivo' ? 'Efectivo' : formData.paymentMethod === 'bizum' ? 'Bizum' : 'Tarjeta (Online)'}\n` +
            (formData.notes ? `\n📝 *Notas:* ${formData.notes}\n` : '') +
            `\n_Pendiente de confirmación_`;

        return encodeURIComponent(message);
    };

    const submitRedsysPayment = async (customAmount = null) => {
        setIsProcessingPayment(true);
        try {
            // Generar OrderID (mín. 4 dígitos numéricos para Redsys)
            // Fecha/hora única (ultimos 8-10 digitos)
            const orderId = String(Date.now()).slice(-9);
            
            // Si hay customAmount (ej. pruebas), lo usamos. Si no, precio normal.
            const amountToCharge = customAmount !== null ? customAmount : totalPrice * 100;
            
            const response = await fetch('http://localhost:3001/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountToCharge, // Redsys espera céntimos
                    orderId: orderId,
                    clientData: {
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        address: formData.address
                    },
                    cart: cart,
                    date: formData.date,
                    time: formData.time,
                    notes: formData.notes
                })
            });
            const data = await response.json();
            
            if (data.success && data.data) {
                // Crear un formulario invisible y enviarlo (Redirect model de Redsys)
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.data.endpoint;
                form.style.display = 'none';
                
                const params = data.data.formParams;
                for (const key in params) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = params[key];
                    form.appendChild(input);
                }
                
                document.body.appendChild(form);
                form.submit();
                // No habilitamos isLoading=false porque la página cambia.
            } else {
                alert('Error al conectar con el banco: ' + (data.message || data.error || 'Error desconocido'));
                setIsProcessingPayment(false);
            }
        } catch (error) {
            console.error('Error on payment:', error);
            alert('No se pudo contactar con la pasarela de pago. Verifica que el servidor backend esté encendido.');
            setIsProcessingPayment(false);
        }
    };

    const sendToWhatsApp = async () => {
        try {
            const orderId = String(Date.now()).slice(-9);
            await fetch('http://localhost:3001/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    clientData: {
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        address: formData.address
                    },
                    cart,
                    totalPrice,
                    paymentMethod: formData.paymentMethod,
                    date: formData.date,
                    time: formData.time,
                    notes: formData.notes
                })
            });
        } catch (error) {
            console.error('Failed to save manual order to db', error);
        }

        const msg = buildWhatsAppMessage();
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    };

    const resetForm = () => {
        setStep(1);
        setCart({});
        setFormData({
            name: '', phone: '', email: '', address: '',
            date: '', time: '', notes: '', paymentMethod: ''
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                    initial={{ scale: 0.9, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 40, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Hacer Pedido</h2>
                            <p className="text-sm text-gray-500">Paso {step} de {STEPS.length}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="px-5 pt-4">
                        <div className="flex items-center gap-1">
                            {STEPS.map((s) => (
                                <div key={s.id} className="flex-1">
                                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                        s.id <= step ? 'bg-primary' : 'bg-gray-200'
                                    }`} />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            {STEPS.map((s) => (
                                <span key={s.id} className={`text-[10px] font-medium transition-colors ${
                                    s.id === step ? 'text-primary' : 'text-gray-400'
                                }`}>
                                    {s.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5">
                        <AnimatePresence mode="wait">

                            {/* ── PASO 1: Selección de paellas y raciones ── */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    {/* Instrucción */}
                                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
                                        <Users className="w-5 h-5 text-accent-dark shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">Añade las paellas que quieras</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Para cada paella elige cuántas raciones necesitas (mínimo 3 por paella). Puedes combinar varios tipos.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lista de paellas */}
                                    <div className="space-y-2">
                                        {PAELLAS.map((paella) => {
                                            const qty = cart[paella.id] || 0;
                                            const isInCart = qty > 0;

                                            return (
                                                <motion.div
                                                    key={paella.id}
                                                    layout
                                                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                                        isInCart
                                                            ? 'border-primary/30 bg-red-50/40 shadow-sm'
                                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                                >
                                                    {/* Fila principal */}
                                                    <div className="flex items-center gap-3 p-3">
                                                        <img
                                                            src={paella.src}
                                                            alt={paella.title}
                                                            className="w-16 h-16 object-cover rounded-xl shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 text-sm truncate">{paella.title}</h4>
                                                            <span className="text-primary font-bold text-sm">
                                                                {isInCart && qty > 3 ? (
                                                                    <>
                                                                        <span className="line-through text-gray-400 mr-1 text-xs">{paella.price}€</span>
                                                                        {getPricePerPortion(paella.price, qty)}€
                                                                    </>
                                                                ) : (
                                                                    `${paella.price}€`
                                                                )}
                                                                <span className="text-gray-400 font-normal text-xs">/ración</span>
                                                            </span>
                                                        </div>
                                                        <div className="shrink-0">
                                                            {isInCart ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setCart(prev => {
                                                                            const nc = { ...prev };
                                                                            delete nc[paella.id];
                                                                            return nc;
                                                                        });
                                                                    }}
                                                                    className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                                >
                                                                    Quitar
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => initPaella(paella.id)}
                                                                    className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 rounded-xl text-xs font-semibold transition-all duration-200"
                                                                >
                                                                    Añadir
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Panel de raciones — aparece al añadir */}
                                                    <AnimatePresence>
                                                        {isInCart && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="border-t border-primary/10 bg-white/70 px-4 py-3 flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Users className="w-4 h-4 text-primary" />
                                                                    <span className="font-medium">¿Para cuántas personas?</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button
                                                                        onClick={() => removeRacion(paella.id)}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-primary hover:text-primary transition-colors shadow-sm"
                                                                    >
                                                                        <Minus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <div className="text-center min-w-[52px]">
                                                                        <span className="text-xl font-bold text-gray-900">{qty}</span>
                                                                        <p className="text-[10px] text-gray-400 leading-none">
                                                                            {qty === 1 ? 'ración' : 'raciones'}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => addRacion(paella.id)}
                                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {totalRaciones >= 25 && (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            Para más de 25 personas,{' '}
                                            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="font-bold underline">
                                                contáctanos directamente
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── PASO 2: Datos personales ── */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => updateField('name', e.target.value)}
                                                placeholder="Tu nombre"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => updateField('phone', e.target.value)}
                                                placeholder="+34 600 000 000"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                placeholder="tu@email.com"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección de entrega *</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => updateField('address', e.target.value)}
                                                placeholder="Calle, número, piso, municipio..."
                                                rows={2}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── PASO 3: Fecha y hora ── */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de entrega *</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => updateField('date', e.target.value)}
                                                min={minDate}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Hora de entrega * <span className="text-gray-400 font-normal">(±10 min)</span>
                                        </label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {TIME_SLOTS.map((slot) => (
                                                <button
                                                    key={slot}
                                                    onClick={() => updateField('time', slot)}
                                                    className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                                        formData.time === slot
                                                            ? 'border-primary bg-primary text-white shadow-lg shadow-red-500/20'
                                                            : 'border-gray-200 hover:border-primary/50 hover:bg-red-50 text-gray-700'
                                                    }`}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            La entrega puede ser 10 minutos antes o después de la hora seleccionada
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── PASO 4: Pago ── */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Método de pago *</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button
                                                onClick={() => updateField('paymentMethod', 'efectivo')}
                                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 ${
                                                    formData.paymentMethod === 'efectivo'
                                                        ? 'border-primary bg-red-50 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                                    formData.paymentMethod === 'efectivo' ? 'bg-primary/10' : 'bg-gray-100'
                                                }`}>
                                                    💵
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-bold text-gray-900">Efectivo</span>
                                                    <p className="text-xs text-gray-500">Pago en la entrega</p>
                                                </div>
                                                {formData.paymentMethod === 'efectivo' && (
                                                    <Check className="ml-auto w-5 h-5 text-primary" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => updateField('paymentMethod', 'bizum')}
                                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 ${
                                                    formData.paymentMethod === 'bizum'
                                                        ? 'border-primary bg-red-50 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                                    formData.paymentMethod === 'bizum' ? 'bg-primary/10' : 'bg-gray-100'
                                                }`}>
                                                    📱
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-bold text-gray-900">Bizum</span>
                                                    <p className="text-xs text-gray-500">Transferencia instantánea</p>
                                                </div>
                                                {formData.paymentMethod === 'bizum' && (
                                                    <Check className="ml-auto w-5 h-5 text-primary" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => updateField('paymentMethod', 'tarjeta')}
                                                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 sm:col-span-2 ${
                                                    formData.paymentMethod === 'tarjeta'
                                                        ? 'border-primary bg-red-50 shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                                    formData.paymentMethod === 'tarjeta' ? 'bg-primary/10' : 'bg-gray-100'
                                                }`}>
                                                    💳
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-bold text-gray-900">Tarjeta de crédito/débito</span>
                                                    <p className="text-xs text-gray-500">Pago online seguro (Redsys)</p>
                                                </div>
                                                {formData.paymentMethod === 'tarjeta' && (
                                                    <Check className="ml-auto w-5 h-5 text-primary" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Especificaciones / Notas</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => updateField('notes', e.target.value)}
                                            placeholder="Alergias, preferencias, instrucciones especiales..."
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* ── PASO 5: Resumen ── */}
                            {step === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Líneas de pedido */}
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-primary" /> Tu Pedido
                                        </h4>
                                        <div className="space-y-3">
                                            {Object.entries(cart).map(([id, qty]) => {
                                                const p = PAELLAS.find(p => p.id === id);
                                                if (!p) return null;
                                                return (
                                                    <div key={id} className="flex items-center justify-between text-sm">
                                                        <div>
                                                            <span className="font-medium text-gray-800">{p.title}</span>
                                                            <span className="text-gray-400 ml-2">
                                                                · {qty} {qty === 1 ? 'ración' : 'raciones'} 
                                                                {qty > 3 && <span className="text-green-600 ml-1 text-xs">(Dto. aplicado)</span>}
                                                            </span>
                                                        </div>
                                                        <span className="font-semibold text-gray-900">{getPricePerPortion(p.price, qty) * qty}€</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                                            <span className="font-bold text-gray-900">Total estimado</span>
                                            <span className="text-xl font-bold text-primary">{totalPrice}€</span>
                                        </div>
                                    </div>

                                    {/* Datos del cliente */}
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                                        <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" /> Datos del pedido
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="text-gray-500">Nombre:</span> <span className="font-medium">{formData.name}</span></div>
                                            <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{formData.phone}</span></div>
                                            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.email}</span></div>
                                            <div><span className="text-gray-500">Raciones totales:</span> <span className="font-medium">{totalRaciones}</span></div>
                                        </div>
                                        <div><span className="text-gray-500">Dirección:</span> <span className="font-medium">{formData.address}</span></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div><span className="text-gray-500">Fecha:</span> <span className="font-medium">{formData.date}</span></div>
                                            <div><span className="text-gray-500">Hora:</span> <span className="font-medium">{formData.time} (±10 min)</span></div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Pago:</span>{' '}
                                            <span className="font-medium">
                                                {formData.paymentMethod === 'efectivo' ? '💵 Efectivo' : formData.paymentMethod === 'bizum' ? '📱 Bizum' : '💳 Tarjeta'}
                                            </span>
                                        </div>
                                        {formData.notes && (
                                            <div><span className="text-gray-500">Notas:</span> <span className="font-medium">{formData.notes}</span></div>
                                        )}
                                    </div>

                                    {formData.paymentMethod === 'tarjeta' ? (
                                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-3">
                                            <CreditCard className="w-5 h-5 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold">Último paso: Pasarela bancaria</p>
                                                <p className="text-blue-600 mt-0.5">
                                                    Al pulsar "Pagar" serás redirigido a la pasarela 100% segura del banco para realizar el pago online.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 flex items-start gap-3">
                                            <MessageCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold">Último paso: confirmar por WhatsApp</p>
                                                <p className="text-green-600 mt-0.5">
                                                    Al pulsar "Enviar Pedido" se abrirá WhatsApp con tu pedido listo. Solo tienes que darle a enviar.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Disclaimer */}
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-3 mt-4">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p>
                                            <strong>Aviso importante:</strong> Para cancelaciones solo se devolverá el dinero si se avisa con al menos 48h de antelación.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Footer: resumen + navegación */}
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                        {totalRaciones > 0 && step < 5 && (
                            <div className="flex items-center justify-between mb-3 text-sm">
                                <span className="text-gray-500">
                                    {totalPaellas} {totalPaellas === 1 ? 'tipo' : 'tipos'} · {totalRaciones} {totalRaciones === 1 ? 'ración' : 'raciones'}
                                </span>
                                <span className="font-bold text-primary text-lg">{totalPrice}€</span>
                            </div>
                        )}
                        <div className="flex gap-3">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Atrás
                                </button>
                            )}
                            {step < 5 ? (
                                <button
                                    onClick={() => setStep(s => s + 1)}
                                    disabled={!canProceed()}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                                        canProceed()
                                            ? 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-red-500/20'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Siguiente <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : formData.paymentMethod === 'tarjeta' ? (
                                <div className="flex-1 flex flex-col gap-2">
                                    <button
                                        onClick={() => submitRedsysPayment()}
                                        disabled={isProcessingPayment}
                                        className={`w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 ${
                                            isProcessingPayment ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 pulse-glow'
                                        }`}
                                    >
                                        {isProcessingPayment ? 'Conectando...' : (
                                            <>
                                                <CreditCard className="w-5 h-5" /> Pagar Total
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => submitRedsysPayment(1)} // 1 céntimo = 0,01€
                                        disabled={isProcessingPayment}
                                        className="w-full py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 transition-all duration-200"
                                    >
                                        🧪 Pagar 0,01€ de prueba
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={sendToWhatsApp}
                                    className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all duration-200 pulse-glow"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    Enviar
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OrderForm;
