import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, User, Phone, Mail, MapPin, Calendar, Clock,
  CreditCard, Banknote, Gift, Link, CheckCircle, Loader, ShoppingBag } from 'lucide-react';
import { PAELLAS, TIME_SLOTS, getPricePerPerson } from '../data/paellas';



function genOrderId() {
  const ts = Date.now().toString().slice(-8);          // 8 digits
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase(); // 4 alphanum
  return `${ts}${rand}`;  // 12 chars total, starts with 8 digits — valid for Redsys
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function NewOrderModal({ isOpen, onClose, onCreated }) {
  const emptyClient = { name: '', phone: '', email: '', address: '' };
  const [client, setClient] = useState(emptyClient);
  const [cart, setCart] = useState({});
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:15');
  const [notes, setNotes] = useState('');
  const [payMethod, setPayMethod] = useState('cash'); // cash | card | invitation | link
  const [payStatus, setPayStatus] = useState('PAID');
  const [loading, setLoading] = useState(false);
  const [payLink, setPayLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1=order, 2=client, 3=payment

  useEffect(() => {
    if (!isOpen) {
      // reset on close
      setClient(emptyClient); setCart({}); setDate(''); setTime('14:15');
      setNotes(''); setPayMethod('cash'); setPayStatus('PAID');
      setPayLink(null); setCopied(false); setStep(1); setLoading(false);
    }
  }, [isOpen]);

  const total = Object.entries(cart).reduce((s, [id, qty]) => {
    const p = PAELLAS.find(p => p.id === id);
    return s + (p ? getPricePerPerson(p, qty) * qty : 0);
  }, 0);

  function setQty(id, delta) {
    setCart(prev => {
      const next = { ...prev };
      const val = (next[id] || 0) + delta;
      if (val <= 0) delete next[id];
      else next[id] = val;
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    const orderId = genOrderId();

    if (payMethod === 'link') {
      // Save order as PENDING, then get Redsys link
      try {
        const res = await fetch('http://localhost:3001/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: Math.round(total * 100),
            clientData: client,
            cart,
            date,
            time,
            notes,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const { endpoint, formParams, shareableUrl } = data.data;
          setPayLink({ endpoint, ...formParams, shareableUrl });
          onCreated?.();
        }
      } catch (e) { console.error(e); }
    } else {
      // Save directly via orders API
      const status = payMethod === 'invitation' ? 'PAID' : payStatus;
      const method = payMethod === 'invitation' ? 'invitation' : payMethod === 'card' ? 'tarjeta' : 'cash';
      try {
        await fetch('http://localhost:3001/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            clientData: client,
            cart,
            totalPrice: total,
            paymentMethod: method,
            paymentStatus: status,
            date,
            time,
            notes,
          }),
        });
        onCreated?.();
        onClose();
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  }

  async function copyLink() {
    if (!payLink?.shareableUrl) return;
    await navigator.clipboard.writeText(payLink.shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canNext1 = Object.keys(cart).length > 0;
  const canNext2 = client.name.trim() && client.phone.trim() && date;
  const canSubmit = canNext2 && (payMethod !== 'link' || total > 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <div className="flex items-center gap-3 text-white">
              <ShoppingBag className="w-5 h-5" />
              <div>
                <div className="font-bold text-lg">Nuevo Pedido</div>
                <div className="text-xs text-orange-100">Pedido manual por teléfono</div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex border-b border-gray-100">
            {[['1', 'Productos'], ['2', 'Cliente'], ['3', 'Pago']].map(([n, label], i) => (
              <button key={n} onClick={() => { if (i === 1 && canNext1) setStep(2); if (i === 2 && canNext2) setStep(3); if (i === 0) setStep(1); }}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors
                  ${step === i + 1 ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold
                  ${step === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{n}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ── STEP 1: Productos ── */}
            {step === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-3">Selecciona raciones por producto</p>
                {PAELLAS.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all
                    ${cart[p.id] ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-400">
                        {cart[p.id] ? `${getPricePerPerson(p, cart[p.id])}€ / persona` : `desde ${p.P25}€ / persona`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(p.id, -1)} disabled={!cart[p.id]}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">{cart[p.id] || 0}</span>
                      <button onClick={() => setQty(p.id, 1)}
                        className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 2: Cliente ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><User className="w-3 h-3" /> Nombre *</label>
                    <input value={client.name} onChange={e => setClient(p => ({ ...p, name: e.target.value }))}
                      placeholder="María García" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><Phone className="w-3 h-3" /> Teléfono *</label>
                    <input value={client.phone} onChange={e => setClient(p => ({ ...p, phone: e.target.value }))}
                      placeholder="612 345 678" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><Mail className="w-3 h-3" /> Email</label>
                    <input value={client.email} onChange={e => setClient(p => ({ ...p, email: e.target.value }))}
                      placeholder="cliente@email.com" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Dirección</label>
                    <input value={client.address} onChange={e => setClient(p => ({ ...p, address: e.target.value }))}
                      placeholder="Calle Mayor 12, La Eliana" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Fecha entrega *</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><Clock className="w-3 h-3" /> Hora entrega</label>
                    <select value={time} onChange={e => setTime(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Anotaciones especiales</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Dejar en portería, sin gluten, acceso por puerta trasera..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
                </div>
              </div>
            )}

            {/* ── STEP 3: Pago ── */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Resumen */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Resumen del pedido</div>
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = PAELLAS.find(x => x.id === id);
                    return p ? (
                      <div key={id} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-700">{p.title} ×{qty} pers.</span>
                        <span className="font-medium">{(getPricePerPerson(p, qty) * qty).toFixed(2)}€</span>
                      </div>
                    ) : null;
                  })}
                  <div className="flex justify-between font-bold text-base pt-2 mt-2 border-t border-gray-200">
                    <span>Total</span><span className="text-orange-600">{total.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Método de pago */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Forma de pago</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'cash',       icon: <Banknote className="w-5 h-5" />,    label: 'Efectivo',    sub: 'Cobro en mano' },
                      { id: 'card',       icon: <CreditCard className="w-5 h-5" />,  label: 'Tarjeta',     sub: 'Ya cobrado' },
                      { id: 'invitation', icon: <Gift className="w-5 h-5" />,         label: 'Invitación',  sub: 'Sin coste' },
                      { id: 'link',       icon: <Link className="w-5 h-5" />,         label: 'Link de pago',sub: 'Redsys TPV' },
                    ].map(m => (
                      <button key={m.id} onClick={() => setPayMethod(m.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                          ${payMethod === m.id
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                        <span className={payMethod === m.id ? 'text-orange-500' : 'text-gray-400'}>{m.icon}</span>
                        <div>
                          <div className="font-semibold text-sm">{m.label}</div>
                          <div className="text-xs text-gray-400">{m.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash: pendiente o ya cobrado */}
                {payMethod === 'cash' && (
                  <div className="flex gap-3">
                    {[['PENDING','Pendiente de cobro'],['PAID','Ya cobrado']].map(([v, label]) => (
                      <button key={v} onClick={() => setPayStatus(v)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                          ${payStatus === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Invitation note */}
                {payMethod === 'invitation' && (
                  <div className="text-xs text-gray-500 bg-purple-50 border border-purple-200 rounded-xl p-3">
                    🎁 El pedido se guardará como <strong>pagado</strong> con método <em>Invitación</em>. No se generará ningún cobro.
                  </div>
                )}

                {payMethod === 'link' && payLink && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <CheckCircle className="w-4 h-4" /> Pedido guardado · Link de pago generado
                    </div>
                    <p className="text-xs text-gray-600">Copia el link y envíalo al cliente por WhatsApp o email para que pague con tarjeta.</p>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 break-all font-mono">
                      {payLink.shareableUrl}
                    </div>
                    <button onClick={copyLink}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                        ${copied ? 'bg-emerald-500 text-white' : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
                      {copied ? <><CheckCircle className="w-4 h-4" /> ¡Copiado!</> : <><Link className="w-4 h-4" /> Copiar link de pago</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="text-sm font-bold text-gray-900">
              {Object.keys(cart).length > 0 && <span className="text-orange-600">{total.toFixed(2)}€</span>}
            </div>
            <div className="flex gap-3">
              {step > 1 && !payLink && (
                <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  Atrás
                </button>
              )}
              {payLink ? (
                <button onClick={onClose} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all">
                  Cerrar
                </button>
              ) : step < 3 ? (
                <button onClick={() => setStep(s => s + 1)}
                  disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                  Siguiente →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!canSubmit || loading}
                  className="px-5 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                  {loading ? <><Loader className="w-4 h-4 animate-spin" /> Guardando…</> : (payMethod === 'link' ? <><Link className="w-4 h-4" /> Generar link</> : <><CheckCircle className="w-4 h-4" /> Confirmar pedido</>)}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
