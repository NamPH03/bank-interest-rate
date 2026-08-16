import { BankSeed } from "../types/bank";

export const STANDARD_TERMS: readonly number[] = [1, 3, 6, 9, 12, 18, 24, 36] as const;

export const DEFAULT_RATE_TYPE = "online_standard";

export const DEFAULT_THRESHOLDS = {
  SIGNAL_MIN_BANKS: 6, // Ít nhất 6/10 ngân hàng đổi chiều
  SIGNAL_CHANGE_THRESHOLD: 0.20, // Biến động trung bình >= 0.20 điểm %
  SIGNAL_STRONG_THRESHOLD: 0.25, // Biến động trung bình >= 0.25 điểm %
  SIGNAL_COOLDOWN_HOURS: 24, // Không gửi alert cùng chiều trong 24h trừ khi có đợt tăng mới
  RATE_MIN_VALID: 0.1, // Lãi suất tối thiểu hợp lệ (%/năm)
  RATE_MAX_VALID: 15.0, // Lãi suất tối đa hợp lệ (%/năm)
  RATE_MAX_DAILY_JUMP: 3.0, // Bước nhảy bất thường tối đa trong 1 ngày (điểm %)
};

export const INITIAL_BANKS: BankSeed[] = [
  {
    id: "vietcombank",
    code: "VCB",
    name: "Ngân hàng TMCP Ngoại thương Việt Nam",
    shortName: "Vietcombank",
    website: "https://portal.vietcombank.com.vn",
    crawler: "vietcombank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "bidv",
    code: "BIDV",
    name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
    shortName: "BIDV",
    website: "https://bidv.com.vn",
    crawler: "bidv",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "vietinbank",
    code: "CTG",
    name: "Ngân hàng TMCP Công Thương Việt Nam",
    shortName: "VietinBank",
    website: "https://vietinbank.vn",
    crawler: "vietinbank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "agribank",
    code: "VBA",
    name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam",
    shortName: "Agribank",
    website: "https://agribank.com.vn",
    crawler: "agribank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "techcombank",
    code: "TCB",
    name: "Ngân hàng TMCP Kỹ Thương Việt Nam",
    shortName: "Techcombank",
    website: "https://techcombank.com",
    crawler: "techcombank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "mb",
    code: "MBB",
    name: "Ngân hàng TMCP Quân đội",
    shortName: "MB",
    website: "https://mbbank.com.vn",
    crawler: "mb",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "vpbank",
    code: "VPB",
    name: "Ngân hàng TMCP Việt Nam Thịnh Vượng",
    shortName: "VPBank",
    website: "https://vpbank.com.vn",
    crawler: "vpbank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "acb",
    code: "ACB",
    name: "Ngân hàng TMCP Á Châu",
    shortName: "ACB",
    website: "https://acb.com.vn",
    crawler: "acb",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "hdbank",
    code: "HDB",
    name: "Ngân hàng TMCP Phát triển TP.HCM",
    shortName: "HDBank",
    website: "https://hdbank.com.vn",
    crawler: "hdbank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
  {
    id: "sacombank",
    code: "STB",
    name: "Ngân hàng TMCP Sài Gòn Thương Tín",
    shortName: "Sacombank",
    website: "https://sacombank.com.vn",
    crawler: "sacombank",
    rateType: DEFAULT_RATE_TYPE,
    isActive: true,
  },
];
