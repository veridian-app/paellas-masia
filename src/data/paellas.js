// ── Dynamic pricing ──────────────────────────────────────────────────────────
// precio(n) = P3 - ((n - 3) / (25 - 3)) * (P3 - P25)
// Rounded to nearest 0.10€

/**
 * Calculate price per person for a given number of people.
 * @param {object} product - Must have .P3 and .P25
 * @param {number} n - Number of people (3–25)
 * @returns {number} Price per person, rounded to nearest 0.10
 */
export function getPricePerPerson(product, n) {
    const clamped = Math.max(3, Math.min(25, n));
    const raw = product.P3 - ((clamped - 3) / (25 - 3)) * (product.P3 - product.P25);
    return Math.round(raw * 10) / 10;
}

/**
 * Get the minimum display price (P25) for "desde X€" labels.
 */
export function getMinPrice(product) {
    return product.P25;
}

// ── Product catalogue ────────────────────────────────────────────────────────
export const PAELLAS = [
    {
        id: 'valenciana',
        src: '/images/paellas-nobg/valenciana.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Valenciana sin fondo.png?v=4',
        title: 'Paella Valenciana',
        description: 'La auténtica receta valenciana con pollo, conejo y verduras frescas de la huerta.',
        P3: 12, P25: 8,
        ingredients: ['Pollo', 'Conejo', 'Judía Verde', 'Garrofó', 'Tomate', 'Arroz', 'Azafrán'],
        allergens: ['Ninguno'],
        category: 'clasica'
    },
    {
        id: 'marisco',
        src: '/images/paellas-nobg/marisco.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Marisco sin fondo.png?v=4',
        title: 'Paella de Marisco',
        description: 'Todo el sabor del mar con gambas, cigalas, anillas de calamar y mejillones.',
        P3: 16, P25: 12,
        ingredients: ['Gambas', 'Cigalas', 'Calamar', 'Mejillones', 'Fumet de Pescado', 'Arroz'],
        allergens: ['Crustáceos', 'Moluscos', 'Pescado'],
        category: 'mar'
    },
    {
        id: 'senyoret',
        src: '/images/paellas-nobg/senyoret.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Senyoret sin fondo.png?v=4',
        title: 'Arroz del Señoret',
        description: 'Arroz con todo el marisco pelado, listo para disfrutar sin mancharse las manos.',
        P3: 15, P25: 10,
        ingredients: ['Gambas Peladas', 'Emperador', 'Sepia', 'Fumet', 'Arroz'],
        allergens: ['Crustáceos', 'Moluscos', 'Pescado'],
        category: 'mar'
    },
    {
        id: 'fideua-marisco',
        src: '/images/paellas-nobg/marisco.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Marisco sin fondo.png?v=4',
        title: 'Fideuá de Marisco',
        description: 'Auténtica fideuá con marisco de primera calidad y fideo fino.',
        P3: 18, P25: 12,
        ingredients: ['Gambas', 'Cigalas', 'Calamar', 'Mejillones', 'Fumet de Pescado', 'Fideo'],
        allergens: ['Crustáceos', 'Moluscos', 'Pescado', 'Gluten'],
        category: 'mar'
    },
    {
        id: 'pato-foie-setas',
        src: '/images/paellas-nobg/pato.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Costillas y Setas sin fondo.png?v=4',
        title: 'Arroz de Pato, Setas y Foie',
        description: 'Exquisito arroz meloso con confit de pato, foie y setas de temporada.',
        P3: 18, P25: 13,
        ingredients: ['Pato', 'Foie', 'Setas', 'Arroz', 'Caldo de Ave'],
        allergens: ['Ninguno'],
        category: 'premium'
    },
    {
        id: 'entrecot-calabaza',
        src: '/images/paellas-nobg/entrecot.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Entrecot y Calabaza sin fondo.png?v=4',
        title: 'Arroz de Entrecot y Calabaza',
        description: 'Arroz con entrecot trinchado a la brasa y calabaza caramelizada.',
        P3: 16, P25: 11,
        ingredients: ['Entrecot de Ternera', 'Calabaza Caramelizada', 'Arroz', 'Caldo de Carne'],
        allergens: ['Ninguno'],
        category: 'premium'
    },
    {
        id: 'carabineros-vieiras',
        src: '/images/paellas-nobg/carabineros.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Carabineros sin fondo.png?v=4',
        title: 'Arroz de Carabineros y Vieiras',
        description: 'Arroz de lujo con carabineros y vieiras, sabor marino intenso.',
        P3: 21, P25: 16,
        ingredients: ['Carabineros', 'Vieiras', 'Fumet de Marisco', 'Arroz'],
        allergens: ['Crustáceos', 'Moluscos'],
        category: 'premium'
    },
    {
        id: 'secreto-setas-foie',
        src: '/images/paellas-nobg/secreto.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Costillas y Setas sin fondo.png?v=4',
        title: 'Arroz de Secreto, Setas y Foie',
        description: 'Secreto ibérico con setas de temporada y un toque de foie. Puro sabor.',
        P3: 16, P25: 10,
        ingredients: ['Secreto Ibérico', 'Setas', 'Foie', 'Arroz', 'Caldo de Carne'],
        allergens: ['Ninguno'],
        category: 'premium'
    },
    {
        id: 'arroz-negro',
        src: '/images/paellas-nobg/senyoret.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Senyoret sin fondo.png?v=4',
        title: 'Arroz Negro',
        description: 'Tradicional arroz negro con sepia, calamar y su tinta.',
        P3: 17, P25: 11,
        ingredients: ['Sepia', 'Calamar', 'Tinta de Calamar', 'Fumet de Pescado', 'Arroz'],
        allergens: ['Crustáceos', 'Moluscos', 'Pescado'],
        category: 'mar'
    },
    {
        id: 'torreznos-pimientos',
        src: '/images/paellas-nobg/torreznos.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Costillas y Setas sin fondo.png?v=4',
        title: 'Arroz de Torreznos y Pimientos del Piquillo',
        description: 'Torreznos crujientes con pimientos del piquillo sobre un arroz con cuerpo.',
        P3: 15, P25: 10,
        ingredients: ['Torreznos', 'Pimientos del Piquillo', 'Arroz', 'Caldo de Carne'],
        allergens: ['Ninguno'],
        category: 'carne'
    },
    {
        id: 'vegetariana',
        src: '/images/paellas-nobg/valenciana.png?v=4',
        srcTransparent: '/Paellas quitar fondo/Valenciana sin fondo.png?v=4',
        title: 'Paella Vegetariana',
        description: 'Arroz con verduras de temporada de la huerta valenciana. 100% vegetal.',
        P3: 15, P25: 11,
        ingredients: ['Alcachofa', 'Judía Verde', 'Garrofó', 'Pimiento', 'Tomate', 'Arroz', 'Azafrán'],
        allergens: ['Ninguno'],
        category: 'clasica'
    }
];

export const CATEGORIES = {
    all: 'Todos',
    clasica: 'Clásicas',
    mar: 'Del Mar',
    carne: 'De Carne',
    premium: 'Premium'
};

export const TIME_SLOTS = [
    '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45'
];

export const WHATSAPP_NUMBER = '34615614695';
