export interface Deal {
  id: string;
  scanId: string;
  retailer: string;
  retailerLogoUrl: string | null;
  productTitle: string;
  price: string; // Decimal comes as string from Prisma
  originalPrice: string | null;
  currency: string;
  condition: string | null;
  productUrl: string;
  imageUrl: string | null;
  savingsAmount: string | null;
  savingsPercent: number | null;
  createdAt: string;
}

export interface Scan {
  id: string;
  userId: string;
  imageUrl: string;
  productName: string;
  brand: string | null;
  model: string | null;
  category: string;
  attributes: Record<string, string>;
  estimatedRetailPrice: string | null;
  aiConfidence: number;
  searchQueries: string[];
  createdAt: string;
  deals?: Deal[];
}

export interface PaginatedScans {
  scans: Scan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  subscriptionStatus: string;
  totalScans: number;
  totalSavings: string;
  totalClicks: number;
  createdAt: string;
}

export interface UserStats {
  totalScans: number;
  totalSavings: string;
  totalClicks: number;
  dealsFound: number;
}

export interface SavedScanRecord {
  id: string;
  userId: string;
  scanId: string;
  createdAt: string;
}

export interface ClickRecord {
  id: string;
  clickedAt: string;
}
