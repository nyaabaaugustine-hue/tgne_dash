import { AppData } from './types';

export const INITIAL_DATA: AppData = {
  clients: [
    {
      id: 'c1',
      name: 'Kofi Mensah',
      businessName: 'Kofi\'s Crafts',
      phone: '+233 24 123 4567',
      email: 'kofi@crafts.com',
      location: 'Accra, Ghana',
      avatarUrl: 'https://picsum.photos/seed/kofi/400/300',
      notes: 'Loves clean, modern designs and high-contrast visuals.',
      createdAt: '2023-10-01'
    },
    {
      id: 'c2',
      name: 'Sarah Jenkins',
      businessName: 'Jenkins Bakery',
      phone: '+1 555 123 4567',
      email: 'sarah@bakery.com',
      location: 'Portland, OR',
      avatarUrl: 'https://picsum.photos/seed/sarah/400/300',
      notes: 'Needs regular blog updates and seasonal promotional banners.',
      createdAt: '2023-11-15'
    },
    {
      id: 'c3',
      name: 'Marco Rossi',
      businessName: 'Rossi Interiors',
      phone: '+39 02 123 4567',
      email: 'marco@rossi.it',
      location: 'Milan, Italy',
      avatarUrl: 'https://picsum.photos/seed/marco/400/300',
      notes: 'High-end furniture showroom. Requires high-res image optimization.',
      createdAt: '2024-01-20'
    }
  ],
  websites: [
    {
      id: 'w1',
      clientId: 'c1',
      domainName: 'koficrafts.com',
      url: 'https://koficrafts.com',
      hostingProvider: 'Bluehost',
      platform: 'WordPress',
      dateCreated: '2023-10-05',
      projectPrice: 1500,
      paymentStatus: 'Paid',
      expiryDate: '2024-10-05'
    },
    {
      id: 'w2',
      clientId: 'c2',
      domainName: 'jenkinsbakery.com',
      url: 'https://jenkinsbakery.com',
      hostingProvider: 'SiteGround',
      platform: 'WordPress',
      dateCreated: '2023-11-20',
      projectPrice: 1200,
      paymentStatus: 'Unpaid',
      expiryDate: '2024-03-20'
    }
  ],
  credentials: [
    {
      id: 'cr1',
      clientId: 'c1',
      type: 'WordPress Admin',
      username: 'admin',
      password: btoa('P@ssword123'),
      url: 'https://koficrafts.com/wp-admin'
    }
  ],
  tasks: [
    {
      id: 't1',
      clientId: 'c1',
      description: 'Review homepage',
      status: 'Pending',
      dueDate: '2024-03-01'
    },
    {
      id: 't2',
      clientId: 'c2',
      description: 'Set up Google Analytics',
      status: 'In Progress',
      dueDate: '2024-02-28'
    }
  ],
  reminders: [
    {
      id: 'r1',
      type: 'Domain',
      title: 'jenkinsbakery.com Domain Expiry',
      date: '2024-03-20',
      isRead: false
    }
  ]
};
