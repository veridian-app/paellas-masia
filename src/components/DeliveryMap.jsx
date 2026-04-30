import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Truck, Clock, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Entrenaranjos coordinates (La Eliana area, northwest Valencia)
const CENTER = [39.5667, -0.5264];
const RADIUS_KM = 10;
const RADIUS_M = RADIUS_KM * 1000;

const DELIVERY_ZONES = [
    'Riba-roja de Túria',
    'L\'Eliana',
    'Masía de Traver',
    'La Cañada',
    'Valencia la Vella',
    'Loriguilla',
    'Vilamarxant',
    'Pobla de Vallbona',
    'Bétera',
    'San Antonio de Benagéber',
    'Paterna',
    'Burjassot',
    'Godella',
    'Rocafort',
    'Moncada',
    'Náquera',
    'Lliria',
    'Benaguasil',
    'Cheste',
    'Chiva',
];

const DeliveryMap = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        if (mapInstanceRef.current) return;

        // Dynamic import of Leaflet for SSR safety
        import('leaflet').then((L) => {
            if (mapInstanceRef.current) return;

            const map = L.map(mapRef.current, {
                center: CENTER,
                zoom: 11,
                scrollWheelZoom: false,
                zoomControl: true,
                attributionControl: true,
            });

            // Beautiful map style
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            // Delivery radius circle - outer glow
            L.circle(CENTER, {
                radius: RADIUS_M,
                color: '#C8102E',
                weight: 2,
                opacity: 0.3,
                fillColor: '#C8102E',
                fillOpacity: 0.06,
                dashArray: '10, 8',
            }).addTo(map);



            // Custom icon for center marker
            const centerIcon = L.divIcon({
                html: `
                    <div style="
                        width: 40px; height: 40px;
                        background: linear-gradient(135deg, #C8102E, #E63946);
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 4px 15px rgba(200,16,46,0.4);
                        display: flex; align-items: center; justify-content: center;
                        animation: pulse-marker 2s infinite;
                    ">
                        <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    </div>
                `,
                className: '',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            L.marker(CENTER, { icon: centerIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="text-align:center; padding:4px; font-family:Inter, sans-serif;">
                        <strong style="font-size:14px; color:#C8102E;">📍 Entrenaranjos</strong>
                        <br/>
                        <span style="font-size:12px; color:#666;">Centro de reparto</span>
                        <br/>
                        <span style="font-size:11px; color:#999;">Radio de ${RADIUS_KM} km</span>
                    </div>
                `);

            // Add pulse animation style
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse-marker {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);

            mapInstanceRef.current = map;
            setMapReady(true);

            // Fix map display after initial render
            setTimeout(() => map.invalidateSize(), 200);
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <section id="zona" className="py-20 md:py-28 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-50 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header */}
                <div className="text-center mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-red-50 text-primary text-sm font-semibold rounded-full mb-4">
                            📍 Zona de reparto
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
                            Llegamos a Tu Puerta
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                            Repartimos en un radio de {RADIUS_KM} km desde Entrenaranjos.
                            Si estás en la zona, ¡tu paella te espera!
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Map */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                            <div ref={mapRef} className="w-full h-[400px] md:h-[500px]" />
                            {!mapReady && (
                                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                                    <span className="text-gray-400">Cargando mapa...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Info sidebar */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {/* Stats cards */}
                        <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-2xl shadow-elevated">
                            <Truck className="w-8 h-8 mb-3 opacity-80" />
                            <h3 className="text-2xl font-bold mb-1">{RADIUS_KM} km</h3>
                            <p className="text-white/80 text-sm">Radio de entrega máximo</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-100">
                            <Clock className="w-7 h-7 mb-3 text-accent" />
                            <h3 className="text-xl font-bold text-gray-900 mb-1">±10 min</h3>
                            <p className="text-gray-500 text-sm">Margen de entrega sobre la hora elegida</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-card border border-gray-100">
                            <MapPin className="w-7 h-7 mb-3 text-primary" />
                            <h3 className="text-base font-bold text-gray-900 mb-3">Zonas de reparto</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {DELIVERY_ZONES.slice(0, 10).map((zone) => (
                                    <span
                                        key={zone}
                                        className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        {zone}
                                    </span>
                                ))}
                                <span className="text-xs text-gray-400 px-2 py-1">
                                    y más...
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default DeliveryMap;
