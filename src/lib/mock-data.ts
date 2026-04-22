import { AppData } from './types';

const NOW = new Date().toISOString();

export const INITIAL_DATA: AppData = {
  clients: [
    {
      id: 'c1', name: 'Kofi Mensah', businessName: "Kofi's Crafts",
      phone: '+233 24 123 4567', email: 'kofi@crafts.com', location: 'Accra, Ghana',
      avatarUrl: 'https://picsum.photos/seed/kofi/600/400',
      notes: 'Loves clean, modern designs and high-contrast visuals.',
      createdAt: '2023-10-01T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c2', name: 'Sarah Jenkins', businessName: 'Jenkins Bakery',
      phone: '+1 555 123 4567', email: 'sarah@bakery.com', location: 'Portland, OR',
      avatarUrl: 'https://picsum.photos/seed/sarah/600/400',
      notes: 'Needs regular blog updates and seasonal promotional banners.',
      createdAt: '2023-11-15T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c3', name: 'Marco Rossi', businessName: 'Rossi Interiors',
      phone: '+39 02 123 4567', email: 'marco@rossi.it', location: 'Milan, Italy',
      avatarUrl: 'https://picsum.photos/seed/marco/600/400',
      notes: 'High-end furniture showroom. Requires high-res image optimization.',
      createdAt: '2024-01-20T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c4', name: 'Elena Petrova', businessName: 'Petrova Legal',
      phone: '+359 2 987 6543', email: 'elena@petrova-legal.bg', location: 'Sofia, Bulgaria',
      avatarUrl: 'https://picsum.photos/seed/elena/600/400',
      notes: 'Professional law firm. Prefers conservative, authoritative color palettes.',
      createdAt: '2024-02-05T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c5', name: 'Jack Thorne', businessName: 'Thorne Outdoors',
      phone: '+1 604 555 0199', email: 'jack@thorneoutdoors.ca', location: 'Vancouver, Canada',
      avatarUrl: 'https://picsum.photos/seed/jack/600/400',
      notes: 'Adventure gear retailer. Needs a focus on mobile responsiveness for hikers.',
      createdAt: '2024-02-12T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c6', name: 'Mei Lin', businessName: "Lin's Tea House",
      phone: '+81 75 123 4567', email: 'mei@linstea.jp', location: 'Kyoto, Japan',
      avatarUrl: 'https://picsum.photos/seed/mei/600/400',
      notes: 'Traditional tea ceremonies. Aesthetic must be minimalist and serene.',
      createdAt: '2024-02-18T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c7', name: 'Anita Desai', businessName: 'Desai Tech',
      phone: '+91 80 4567 8901', email: 'anita@desaitech.in', location: 'Bangalore, India',
      avatarUrl: 'https://picsum.photos/seed/anita/600/400',
      notes: 'SaaS startup. Fast-paced environment with frequent feature requests.',
      createdAt: '2024-03-01T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c8', name: 'Carlos Mendez', businessName: 'Mendez Tapas',
      phone: '+34 93 123 4567', email: 'carlos@mendeztapas.es', location: 'Barcelona, Spain',
      avatarUrl: 'https://picsum.photos/seed/carlos/600/400',
      notes: 'Vibrant restaurant. Needs integration with reservation platforms.',
      createdAt: '2024-03-05T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c9', name: 'Sophie Laurent', businessName: 'Laurent Mode',
      phone: '+33 1 45 67 89 00', email: 'sophie@laurentmode.fr', location: 'Paris, France',
      avatarUrl: 'https://picsum.photos/seed/sophie/600/400',
      notes: 'Boutique fashion house. Strong focus on visual storytelling and high-res video.',
      createdAt: '2024-03-10T00:00:00.000Z', updatedAt: NOW,
    },
    {
      id: 'c10', name: 'David Smith', businessName: 'Smith Financial',
      phone: '+44 20 7946 0000', email: 'david@smithfinancial.co.uk', location: 'London, UK',
      avatarUrl: 'https://picsum.photos/seed/david/600/400',
      notes: 'Wealth management. Security and data privacy are top priorities.',
      createdAt: '2024-03-12T00:00:00.000Z', updatedAt: NOW,
    },
  ],
  websites: [
    {
      id: 'w1', clientId: 'c1', domainName: 'koficrafts.com',
      url: 'https://koficrafts.com', hostingProvider: 'Bluehost',
      platform: 'WordPress', dateCreated: '2023-10-05',
      projectPrice: 1500, paymentStatus: 'Paid', expiryDate: '2025-10-05',
    },
    {
      id: 'w2', clientId: 'c2', domainName: 'jenkinsbakery.com',
      url: 'https://jenkinsbakery.com', hostingProvider: 'SiteGround',
      platform: 'WordPress', dateCreated: '2023-11-20',
      projectPrice: 1200, paymentStatus: 'Unpaid', expiryDate: '2024-11-20',
    },
  ],
  credentials: [],
  tasks: [],
  payments: [],
  reminders: [
    { id: 'r1', type: 'Domain',         title: 'Domain Renewal: koficrafts.com',      date: '2025-10-05', isRead: false, details: 'Automatic renewal scheduled via TGNE system.' },
    { id: 'r2', type: 'Hosting',        title: 'Hosting Renewal: Jenkins Bakery',     date: '2024-11-20', isRead: false, details: 'SiteGround hosting package renewal.' },
    { id: 'r3', type: 'Web Management', title: 'Q2 Performance Audit: Petrova Legal', date: '2024-06-15', isRead: false, details: 'Quarterly review of SEO and site speed performance.' },
    { id: 'r4', type: 'Web Management', title: 'Monthly Security Patching',           date: '2024-05-01', isRead: false, details: 'Core updates and plugin security hardening for all WP clients.' },
    { id: 'r5', type: 'Domain',         title: 'Domain Expiry: desaitech.io',         date: '2024-12-01', isRead: false, details: 'Vercel domain management renewal.' },
  ],
};
