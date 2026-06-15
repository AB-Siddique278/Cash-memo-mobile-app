export interface CashMemoItem {
  desc: string;
  qty: string;
  rate: string;
  amt: string; // Auto-calculated but stored
}

export interface BusinessProfile {
  shopName: string;
  proprietorName: string;
  services: string;
  address: string;
  mobile1: string;
  mobile2: string;
  logoUrl: string;
  websiteUrl: string;
  noticeLine1: string;
  noticeLine2: string;
  colorTheme: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

export interface CashMemoData {
  id: string; // Unique local storage state UUID
  memoNum: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  items: CashMemoItem[];
  condition1: string;
  condition2: string;
  advance: string;
  grossTotal: number;
  balanceDue: number;
  createdAt: string;
}

export interface ProductPreset {
  id: string;
  name: string;
  defaultRate: string;
}
