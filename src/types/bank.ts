export interface Bank {
  id: string; // e.g. "vietcombank", "techcombank"
  name: string; // "Ngân hàng TMCP Ngoại thương Việt Nam"
  shortName: string; // "Vietcombank"
  code: string; // "VCB"
  website: string;
  crawler: string; // "vietcombank"
  rateType: string; // "online_standard"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BankSeed = Omit<Bank, "createdAt" | "updatedAt">;
