import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, Calendar, CreditCard, ChevronDown, ChevronUp,
  Search, User, Phone, Hash, Clock, ShoppingBag, Star, Repeat,
  MapPin, CheckCircle, Euro, TrendingUp, PlusCircle
} from 'lucide-react';
import NewOrderModal from './NewOrderModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIA_COLORS = {
  'Sáb': 'bg-violet-100 text-violet-700',
  'Dom': 'bg-rose-100 text-rose-700',
};
const DIA_DEFAULT = 'bg-gray-100 text-gray-600';

function getDayOfWeek(dateStr) {
  if (!dateStr) return null;
  // dateStr format: YYYY-MM-DD or DD/MM/YYYY
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return DIAS[d.getDay()];
}

function getWeekLabel(iso) {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  // Monday of that week
  const day = d.getDay() || 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + 1);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (dt) => dt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  // ISO week number
  const jan4 = new Date(mon.getFullYear(), 0, 4);
  const week = Math.ceil(((mon - jan4) / 86400000 + jan4.getDay() + 1) / 7);
  return `Semana ${week} · ${fmt(mon)} – ${fmt(sun)}`;
}

function isCurrentWeek(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const startOfWeek = (dt) => {
    const clone = new Date(dt);
    const day = clone.getDay() || 7;
    clone.setDate(clone.getDate() - day + 1);
    clone.setHours(0, 0, 0, 0);
    return clone;
  };
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

function isCashPending(client) {
  const method = (client.payment_method || '').toLowerCase();
  return client.payment_status === 'PENDING' &&
    !method.includes('card') && method !== 'redsys';
}

function PaymentBadge({ status, method }) {
  const isCard = (method || '').toLowerCase().includes('card') ||
    (method || '').toLowerCase() === 'redsys';
  if (status === 'PAID' || isCard) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CreditCard className="w-3 h-3" /> Pagado · Tarjeta
      </span>
    );
  }
  if (status === 'PAID') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-3 h-3" /> Cobrado · Efectivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
      <Clock className="w-3 h-3" /> Pendiente · Efectivo
    </span>
  );
}

function RecurrenceBadge({ totalOrders }) {
  if (totalOrders <= 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Star className="w-3 h-3" /> Nuevo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
      <Repeat className="w-3 h-3" /> {totalOrders}× repetidor
    </span>
  );
}

function CartSummary({ cart }) {
  if (!cart || Object.keys(cart).length === 0)
    return <span className="text-gray-400 text-xs">Sin artículos</span>;
  return (
    <ul className="space-y-1">
      {Object.entries(cart).map(([id, qty]) => (
        <li key={id} className="flex items-center justify-between text-sm">
          <span className="text-gray-700 font-medium capitalize">{id.replace(/-/g, ' ')}</span>
          <span className="ml-3 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{qty} rac.</span>
        </li>
      ))}
    </ul>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paying, setPaying] = useState(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  const fetchClients = useCallback(() => {
    fetch('http://localhost:3001/api/clients')
      .then(r => r.json())
      .then(d => { if (d.success) setClients(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function markAsPaid(orderId) {
    setPaying(orderId);
    try {
      await fetch(`http://localhost:3001/api/clients/orders/${orderId}/pay`, { method: 'PATCH' });
      fetchClients(); // refresh
    } finally {
      setPaying(null);
    }
  }

  const filtered = clients.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.orderId || '').includes(searchTerm)
  );

  // Group by week
  const weeks = {};
  filtered.forEach(c => {
    const label = getWeekLabel(c.order_created_at);
    if (!weeks[label]) weeks[label] = [];
    weeks[label].push(c);
  });

  // Current-week stats
  const thisWeek = clients.filter(c => isCurrentWeek(c.order_created_at));
  const thisWeekTotal = thisWeek.reduce((s, c) => s + (c.total_price || 0), 0);
  const thisWeekPaid = thisWeek.filter(c => c.payment_status === 'PAID').reduce((s, c) => s + (c.total_price || 0), 0);
  const thisWeekPending = thisWeekTotal - thisWeekPaid;

  const stats = {
    total: clients.length,
    paid: clients.filter(c => c.payment_status === 'PAID').length,
    pending: clients.filter(c => isCashPending(c)).length,
    nuevos: clients.filter(c => c.total_orders <= 1).length,
  };

  const COLS = 9; // number of <td> columns

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(135deg,#fdf6ec 0%,#fff8f0 100%)' }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard de Clientes</h1>
              <p className="text-xs text-gray-500">{clients.length} registros en total</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 min-w-[260px]"
              />
            </div>
            <button
              onClick={() => setNewOrderOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
            >
              <PlusCircle className="w-4 h-4" /> Nuevo pedido
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="max-w-7xl mx-auto px-6 pb-4 grid grid-cols-4 gap-4">
          {[
            { label: 'Total pedidos', value: stats.total, color: '#6366f1' },
            { label: 'Pagados', value: stats.paid, color: '#10b981' },
            { label: 'Pendiente efectivo', value: stats.pending, color: '#f59e0b' },
            { label: 'Clientes nuevos', value: stats.nuevos, color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-2 h-10 rounded-full" style={{ background: s.color }} />
              <div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ── Tarjeta facturación semana actual ── */}
        {thisWeek.length > 0 && (
          <div className="rounded-2xl border border-orange-200 shadow-sm overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)' }}>
            <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-orange-800">Facturación estimada · Semana actual</div>
                  <div className="text-xs text-orange-600">{thisWeek.length} pedidos registrados hasta ahora</div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{thisWeekTotal.toFixed(2)}€</div>
                  <div className="text-xs text-gray-500">Total estimado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-700">{thisWeekPaid.toFixed(2)}€</div>
                  <div className="text-xs text-gray-500">Ya cobrado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{thisWeekPending.toFixed(2)}€</div>
                  <div className="text-xs text-gray-500">Pendiente efectivo</div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ── Modal nuevo pedido ── */}
      <NewOrderModal
        isOpen={newOrderOpen}
        onClose={() => setNewOrderOpen(false)}
        onCreated={() => { fetchClients(); }}
      />

      {/* ── Tabla agrupada por semana ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : (
          Object.entries(weeks).map(([weekLabel, rows]) => {
            const weekTotal = rows.reduce((s, c) => s + (c.total_price || 0), 0);
            const weekPending = rows.filter(c => isCashPending(c)).reduce((s, c) => s + (c.total_price || 0), 0);

            return (
              <div key={weekLabel} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Week header */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-gray-800 text-sm">{weekLabel}</span>
                    <span className="text-xs text-gray-400">({rows.length} pedido{rows.length !== 1 ? 's' : ''})</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Total semana:
                      <span className="ml-1 font-bold text-gray-900">{weekTotal.toFixed(2)}€</span>
                    </span>
                    {weekPending > 0 && (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 text-xs font-medium">
                        Efectivo pendiente: {weekPending.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-gray-500 font-semibold uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><User className="w-3 h-3" /> Cliente</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><Hash className="w-3 h-3" /> ID</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Fecha pedido</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Pedido</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Pago</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Dirección</span></th>
                      <th className="px-5 py-3"><span className="flex items-center gap-1"><Repeat className="w-3 h-3" /> Recurrencia</span></th>
                      <th className="px-5 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((client, idx) => (
                      <React.Fragment key={`${client.orderId}-${idx}`}>
                        <tr
                          className={`border-b border-gray-100 hover:bg-orange-50/40 transition-colors cursor-pointer ${expandedId === client.orderId ? 'bg-orange-50/50' : ''}`}
                          onClick={() => setExpandedId(expandedId === client.orderId ? null : client.orderId)}
                        >
                          {/* Cliente */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-gray-900 text-sm">{client.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[140px]">{client.email}</div>
                          </td>

                          {/* Teléfono */}
                          <td className="px-5 py-3.5 text-sm text-gray-700">{client.phone || '—'}</td>

                          {/* ID */}
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                              #{(client.orderId || '').slice(0, 10)}…
                            </span>
                          </td>

                          {/* Fecha entrega */}
                          <td className="px-5 py-3.5 text-sm text-gray-700">
                            {client.delivery_date ? (
                              <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                                {client.delivery_date}
                                {(() => { const d = getDayOfWeek(client.delivery_date); return d ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${DIA_COLORS[d] || DIA_DEFAULT}`}>{d}</span> : null; })()}
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                            {client.delivery_time && (
                              <div className="text-xs text-gray-400 mt-0.5 ml-5">{client.delivery_time}</div>
                            )}
                          </td>

                          {/* Pedido */}
                          <td className="px-5 py-3.5">
                            {client.cart && Object.keys(client.cart).length > 0 ? (
                              <div className="space-y-0.5">
                                {Object.entries(client.cart).slice(0, 2).map(([id, qty]) => (
                                  <div key={id} className="flex items-center gap-1.5 text-xs text-gray-700">
                                    <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">{qty}</span>
                                    <span className="capitalize truncate max-w-[110px]">{id.replace(/-/g, ' ')}</span>
                                  </div>
                                ))}
                                {Object.keys(client.cart).length > 2 && (
                                  <div className="text-xs text-gray-400">+{Object.keys(client.cart).length - 2} más…</div>
                                )}
                              </div>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                            <div className="text-xs font-bold text-gray-900 mt-1">{client.total_price}€</div>
                          </td>

                          {/* Pago + botón cobrar */}
                          <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                            <PaymentBadge status={client.payment_status} method={client.payment_method} />
                            {isCashPending(client) && (
                              <button
                                onClick={() => markAsPaid(client.orderId)}
                                disabled={paying === client.orderId}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all disabled:opacity-50 shadow-sm"
                              >
                                {paying === client.orderId
                                  ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                  : <CheckCircle className="w-3.5 h-3.5" />}
                                Marcar cobrado
                              </button>
                            )}
                          </td>

                          {/* Dirección + notas */}
                          <td className="px-5 py-3.5">
                            {client.address ? (
                              <div className="text-xs text-gray-700 flex items-start gap-1 max-w-[160px]">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <span>{client.address}</span>
                              </div>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                            {client.notes && (
                              <div className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 max-w-[160px]">
                                📝 {client.notes}
                              </div>
                            )}
                          </td>

                          {/* Recurrencia */}
                          <td className="px-5 py-3.5">
                            <RecurrenceBadge totalOrders={client.total_orders} />
                          </td>

                          {/* Expand */}
                          <td className="px-5 py-3.5 text-gray-400">
                            {expandedId === client.orderId
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />}
                          </td>
                        </tr>

                        {/* Fila expandida */}
                        <AnimatePresence>
                          {expandedId === client.orderId && (
                            <tr className="border-b border-gray-200 bg-orange-50/20">
                              <td colSpan={COLS} className="px-8 py-6">
                                <motion.div
                                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                                  className="grid grid-cols-3 gap-6"
                                >
                                  {/* Pedido completo */}
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                      <ShoppingBag className="w-3.5 h-3.5 text-orange-500" /> Pedido completo
                                    </h4>
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                      <CartSummary cart={client.cart} />
                                      {client.notes && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <span className="text-xs text-gray-500 font-medium">Notas: </span>
                                          <span className="text-xs text-gray-700">{client.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Datos cliente */}
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-orange-500" /> Datos del cliente
                                    </h4>
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2 text-sm">
                                      {[
                                        ['Nombre', client.name],
                                        ['Teléfono', client.phone || '—'],
                                        ['Email', client.email || '—'],
                                        ['Dirección', client.address || '—'],
                                        ['ID cliente', `#${client.clientId}`],
                                      ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between gap-2">
                                          <span className="text-gray-500 shrink-0">{k}</span>
                                          <span className="font-medium text-right truncate max-w-[160px]">{v}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Pago */}
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                      <CreditCard className="w-3.5 h-3.5 text-orange-500" /> Pago y entrega
                                    </h4>
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">{client.total_price}€</span></div>
                                      <div className="flex justify-between"><span className="text-gray-500">Método</span><span className="font-medium capitalize">{client.payment_method || '—'}</span></div>
                                      <div className="flex justify-between items-center"><span className="text-gray-500">Estado</span><PaymentBadge status={client.payment_status} method={client.payment_method} /></div>
                                      {client.delivery_date && <div className="flex justify-between"><span className="text-gray-500">Entrega</span><span className="font-medium">{client.delivery_date} {client.delivery_time}</span></div>}
                                      <div className="flex justify-between">
                                        <span className="text-gray-400 text-xs">Pedido realizado</span>
                                        <span className="text-xs text-gray-400">{formatDateTime(client.order_created_at)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-gray-100"><span className="text-gray-500">Recurrencia</span><RecurrenceBadge totalOrders={client.total_orders} /></div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No se encontraron clientes o pedidos.
          </div>
        )}
      </div>
    </div>
  );
}
