// ── Design Tokens ──
export const C = {
  void: "#0A0414",
  deep: "#120826",
  core: "#1E0F3D",
  mid: "#2D1660",
  primary: "#6B2FA0",
  vivid: "#8B45C8",
  light: "#A85FE0",
  glow: "#C77DFF",
  accent: "#E0AAFF",
  white: "#F5F0FF",
  pure: "#FFFFFF",
  silver: "#C0B8D6",
  muted: "#7A6B94",
  success: "#00E676",
  warning: "#FFD740",
  danger: "#FF5252",
} as const;

// ── Types ──
export type PageId = "deposit" | "proxy" | "connect" | "trade" | "portfolio";
export type BadgeVariant = "default" | "success" | "warning" | "danger" | "active" | "muted" | "secondary";
export type BtnVariant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";
export type BtnSize = "sm" | "md" | "lg";

export interface Asset {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

export interface Proxy {
  id: string;
  safe: string;
  num: string;
  balance: string;
  nonce: number;
  active: boolean;
}

export interface Position {
  coin: string;
  size: string;
  posVal: string;
  entry: string;
  mark: string;
  pnl: string;
  roe: string;
  liq: string;
  margin: string;
  funding: string;
  up: boolean;
}

export interface PortfolioStat {
  label: string;
  value: string;
  color?: string;
}

export interface Transaction {
  type: string;
  amount: string;
  time: string;
  color: "success" | "warning";
}

// ── Mock Data ──
export const ASSETS: Asset[] = [
  { symbol: "BTC", price: "97,842.50", change: "+2.41%", up: true },
  { symbol: "ETH", price: "3,412.80", change: "+1.87%", up: true },
  { symbol: "SOL", price: "186.42", change: "-0.52%", up: false },
];

export const PROXIES: Proxy[] = [
  { id: "0x7a3...f91d", safe: "0xE42...8b1a", num: "1", balance: "8,200", nonce: 0, active: true },
  { id: "0xb12...4e8c", safe: "0xF91...2c7d", num: "2", balance: "4,250", nonce: 1, active: true },
  { id: "0xd5f...a02b", safe: "0xA03...9e4f", num: "3", balance: "0", nonce: 2, active: false },
];

export const POSITIONS: Position[] = [
  { coin: "BTC", size: "0.5", posVal: "$48,921", entry: "$96,450.00", mark: "$97,842.50", pnl: "+$2,840.00", roe: "+5.89%", liq: "Hidden", margin: "$4,892", funding: "-$12.40", up: true },
  { coin: "ETH", size: "-3.5", posVal: "$12,600", entry: "$3,520.00", mark: "$3,412.80", pnl: "+$680.00", roe: "+5.40%", liq: "Hidden", margin: "$2,520", funding: "+$4.20", up: true },
  { coin: "SOL", size: "26", posVal: "$5,000", entry: "$190.20", mark: "$186.42", pnl: "-$210.00", roe: "-4.20%", liq: "Hidden", margin: "$200", funding: "-$1.80", up: false },
];

export const PORTFOLIO_STATS: PortfolioStat[] = [
  { label: "PNL", value: "+$3,310.00", color: "success" },
  { label: "Volume", value: "$142,800.00" },
  { label: "Max Drawdown", value: "4.21%" },
  { label: "Total Equity", value: "$15,760.00" },
  { label: "Perps Account Equity", value: "$12,450.00" },
  { label: "Vault Equity", value: "$3,310.00" },
  { label: "Earn Balance", value: "$0.00" },
];

export const CHART_DATA: number[] = [12000, 12200, 11800, 12400, 12100, 12800, 13200, 12900, 13500, 14200, 13800, 14500, 14100, 14800, 15200, 14900, 15450, 15100, 15800, 15400];

export const TRANSACTIONS: Transaction[] = [
  { type: "Deposit", amount: "+5,000", time: "2m ago", color: "success" },
  { type: "Deposit", amount: "+2,450", time: "1h ago", color: "success" },
  { type: "Withdraw", amount: "-1,200", time: "3h ago", color: "warning" },
];
