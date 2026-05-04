import { useState, useEffect } from 'react';
import { motion, useTransform } from 'framer-motion';

const PaellaCard = ({ item, index, rotation, count, radiusX, radiusY, onSelect }) => {
    const angleStep = 360 / count;

    const angle = useTransform(rotation, (r) => {
        return 90 + (index - r) * angleStep;
    });

    const x = useTransform(angle, (a) => Math.cos((a * Math.PI) / 180) * radiusX);
    const y = useTransform(angle, (a) => Math.sin((a * Math.PI) / 180) * radiusY);

    const scale = useTransform(angle, (a) => {
        const sinVal = Math.sin((a * Math.PI) / 180);
        return 0.5 + ((sinVal + 1) / 2) * 0.55;
    });

    const zIndex = useTransform(scale, (s) => Math.round(s * 100));
    const opacity = useTransform(scale, (s) => (s - 0.5) / 0.55 * 0.7 + 0.3);
    const dynamicFilter = useTransform(scale, s => `drop-shadow(0 10px 15px rgba(0,0,0,0.15)) brightness(0.6) blur(${Math.max(0, (1.05 - s) * 8)}px)`);

    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const unsubscribe = rotation.on("change", (latest) => {
            const normalizedR = Math.round(latest) % count;
            const indexCheck = (normalizedR + count) % count;
            setIsActive(indexCheck === index);
        });
        return unsubscribe;
    }, [rotation, count, index]);

    const handleClick = () => {
        if (isActive) onSelect();
    };

    return (
        <motion.div
            className="absolute flex flex-col items-center justify-center pointer-events-auto"
            style={{
                x, y, scale, zIndex, opacity,
                transformOrigin: "center center",
                width: 'fit-content',
                height: 'fit-content'
            }}
            onClick={handleClick}
        >
            <div className={`flex flex-col items-center gap-2 md:gap-4 relative transition-all duration-300 ${isActive ? 'cursor-pointer' : ''}`}>
                <div className="w-56 h-56 md:w-96 md:h-96 flex items-center justify-center">
                    <motion.div
                        className="w-full h-full relative"
                        style={{ filter: isActive ? 'drop-shadow(0 30px 30px rgba(0,0,0,0.5)) brightness(1) blur(0px)' : dynamicFilter }}
                        animate={{ y: isActive ? [0, -15, 0] : 0 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <img
                            src={item.src}
                            alt={item.title}
                            className={`w-full h-full object-contain pointer-events-none select-none ${item.blend ? 'mix-blend-multiply' : ''}`}
                        />
                    </motion.div>
                </div>

                {/* Title Label */}
                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'scale-90 opacity-80'}`}>
                    <span className="text-gray-900 font-bold text-xs md:text-sm whitespace-nowrap">{item.title}</span>
                    {isActive && <span className="text-primary font-bold text-xs md:text-sm">desde {item.P25}€</span>}
                </div>
            </div>
        </motion.div>
    );
};

export default PaellaCard;
