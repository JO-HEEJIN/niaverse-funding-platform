export interface FundingOption {
  id: string;
  title: string;
  description: string;
  image: string;
  basePrice: number;
  priceStructure: {
    quantity: number;
    price: number;
  }[];
  details: {
    category: string;
    status: 'active' | 'completed' | 'upcoming';
    endDate: string;
    totalRaised: number;
    goal: number;
  };
}

export const fundingOptions: FundingOption[] = [
  {
    id: '1',
    title: 'Funding 1',
    description: 'Revolutionary tech product that will change the way we interact with digital interfaces.',
    image: '/api/placeholder/400/300',
    basePrice: 100000,
    priceStructure: [
      { quantity: 1, price: 100000 },
      { quantity: 2, price: 190000 },
      { quantity: 3, price: 270000 },
      { quantity: 5, price: 450000 },
    ],
    details: {
      category: 'Technology',
      status: 'active',
      endDate: '2024-12-31',
      totalRaised: 5000000,
      goal: 10000000,
    },
  },
  {
    id: '2',
    title: 'Funding 2',
    description: 'Innovative sustainable energy solution for modern households.',
    image: '/api/placeholder/400/300',
    basePrice: 1000000,
    priceStructure: [
      { quantity: 1, price: 1000000 },
      { quantity: 2, price: 2000000 },
      { quantity: 3, price: 2900000 },
      { quantity: 5, price: 4750000 },
    ],
    details: {
      category: 'Energy',
      status: 'active',
      endDate: '2024-11-30',
      totalRaised: 8000000,
      goal: 15000000,
    },
  },
  {
    id: '3',
    title: 'Funding 3',
    description: 'Advanced AI-powered health monitoring system for personal wellness.',
    image: '/api/placeholder/400/300',
    basePrice: 500000,
    priceStructure: [
      { quantity: 1, price: 500000 },
      { quantity: 2, price: 950000 },
      { quantity: 3, price: 1400000 },
      { quantity: 5, price: 2250000 },
    ],
    details: {
      category: 'Healthcare',
      status: 'active',
      endDate: '2025-01-15',
      totalRaised: 3000000,
      goal: 8000000,
    },
  },
];