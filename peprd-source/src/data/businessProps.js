// Props for PepRD. Used as fallbacks if env vars are not set.

module.exports = {
  business: {
    name: 'PepRD',
    botName: 'Peppi',
    tagline: 'Péptidos de investigación de alta pureza — envíos discretos a toda RD',
    address: 'Santo Domingo',
    city: 'Santo Domingo',
    phone: '+1 809 870 8700',
    email: 'ventas@peprd.io',
    website: 'https://peprd.io',
    instagram: '@peprd',
    hours: {
      mondayFriday: '9:00am - 6:00pm',
      saturday: '10:00am - 2:00pm',
      sunday: 'cerrado',
    },
  },

  shipping: {
    zones: [
      { name: 'Santo Domingo', fee: 250, eta: '1-2 días' },
      { name: 'Santiago', fee: 350, eta: '2-3 días' },
      { name: 'Puerto Plata', fee: 400, eta: '2-3 días' },
      { name: 'La Romana', fee: 350, eta: '2-3 días' },
      { name: 'Punta Cana', fee: 450, eta: '3-4 días' },
    ],
    minOrder: 1000,
    discreetPackaging: true,
  },

  paymentMethods: [
    { id: 'transfer', label: 'Transferencia bancaria RD' },
    { id: 'cash',     label: 'Efectivo (solo Santo Domingo)' },
    { id: 'crypto',   label: 'USDT (cripto)' },
  ],

  socialMedia: {
    instagram: 'https://instagram.com/peprd',
    website: 'https://peprd.io',
  },

  policies: {
    useCase: 'Estrictamente uso de investigación. No para consumo humano.',
    purity: '≥99% confirmada por HPLC en cada lote.',
    ageRequirement: 21,
    cancellationPolicy: 'Cancelaciones antes de envío: reembolso completo. Una vez enviado: no aplica.',
    refundPolicy: 'Producto defectuoso o enviado incorrectamente: reemplazo o reembolso al verificar.',
  },
};
