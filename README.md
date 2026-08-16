# Vietnam Bank Interest Rate Monitor — TypeScript + Firebase

Hệ thống tự động theo dõi, phát hiện biến động mặt bằng lãi suất tiền gửi của 10 ngân hàng lớn tại Việt Nam và gửi email cảnh báo khi thị trường có biến động đồng loạt đáng kể.

---

## 1. Tính năng cốt lõi

- **Thu thập dữ liệu thực tế 10 ngân hàng**:
  1. Vietcombank (`VCB`)
  2. BIDV (`BIDV`)
  3. VietinBank (`CTG`)
  4. Agribank (`VBA`)
  5. Techcombank (`TCB`)
  6. MB Bank (`MBB`)
  7. VPBank (`VPB`)
  8. ACB (`ACB`)
  9. HDBank (`HDB`)
  10. Sacombank (`STB`)
- **8 Kỳ hạn chuẩn hóa**: `1M`, `3M`, `6M`, `9M`, `12M`, `18M`, `24M`, `36M`.
- **Chuẩn hóa loại lãi suất**: Tiền gửi Tiết kiệm Trực tuyến Cá nhân VND (`online_standard`).
- **Data Guard / Strict Anomaly Validation**: Tự động từ chối mọi giá trị ngoài khoảng $[0.1\%, 15.0\%]$ hoặc bước nhảy bất thường $> 3.0$ điểm % trong 1 ngày.
- **Change Detection**: Tính toán biến động theo **điểm phần trăm (percentage points)** qua các khung thời gian 1 ngày, 3 ngày, 7 ngày.
- **Signal & Trend Engine**: 
  - Tính toán `Signal Score` ($0 - 100$) và `Trend Score` dựa trên độ phủ (% ngân hàng), biên độ thay đổi và mức độ đồng thuận giữa các kỳ hạn nòng cốt (6M, 12M, 24M).
  - Phân cấp: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- **Smart Cooldown (Chống spam email)**: Không gửi lặp lại trong vòng 24h trừ khi có đợt tăng mới lớn thêm hoặc thị trường đổi chiều.
- **Mobile-First Email Template**: Gửi email định dạng đẹp mắt, tối ưu đọc trên điện thoại qua **Resend API**.
- **Firebase Cloud Functions v2**: Scheduled Cron `0 8 * * *` (8:00 AM hàng ngày theo giờ Việt Nam UTC+7).
- **CLI hoàn chỉnh**: Hỗ trợ chạy thủ công mọi giai đoạn mà không cần chờ Scheduler.

---

## 2. Cài đặt & Cấu hình

### 2.1. Cài đặt Dependencies
```bash
npm install
```

### 2.2. Thiết lập Biến môi trường (`.env`)
Sao chép `.env.example` thành `.env` và điền các thông tin:

```env
# Firebase Configuration (Tùy chọn khi deploy hoặc chạy local với GCP)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json

# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Bank Rate Monitor <alerts@yourdomain.com>
EMAIL_TO=your-email@example.com

# Signal Engine Thresholds (Có thể tùy chỉnh)
SIGNAL_MIN_BANKS=6
SIGNAL_CHANGE_THRESHOLD=0.20
SIGNAL_STRONG_THRESHOLD=0.25
SIGNAL_COOLDOWN_HOURS=24

# Logging: debug | info | warn | error
LOG_LEVEL=info
```

---

## 3. Hướng dẫn sử dụng CLI

Hệ thống cung cấp các lệnh CLI nhanh chóng bằng `tsx`:

### 1. Thu thập dữ liệu lãi suất (`crawl`)
```bash
npm run crawl
# Hoặc chỉ định ngân hàng cụ thể:
npm run crawl -- -b vietcombank techcombank
```

### 2. Phân tích tín hiệu thị trường (`analyze`)
```bash
npm run analyze
```

### 3. Đánh giá cảnh báo & Gửi Email (`notify`)
```bash
npm run notify
# Để mô phỏng hoặc ép gửi email kiểm tra format:
npm run notify -- --force
```

### 4. Chạy toàn bộ chu trình tự động (`run-once`)
```bash
npm run run-once
```

### 5. Kiểm tra trạng thái hệ thống (`healthcheck`)
```bash
npm run healthcheck
```

---

## 4. Chạy Unit Tests

Toàn bộ logic tính toán Normalization, Validation, Change Detection, Signal Engine và Email Formatting được kiểm thử với **Vitest**:

```bash
npm run test
```

---

## 5. Triển khai lên Firebase (Cloud Functions)

### 5.1. Build TypeScript
```bash
npm run build
```

### 5.2. Deploy Cloud Functions & Firestore Rules
```bash
firebase login
firebase use your-project-id
firebase deploy --only functions,firestore
```

Function `dailyRateMonitor` sẽ tự động kích hoạt hàng ngày vào lúc 08:00 AM (giờ Việt Nam).
