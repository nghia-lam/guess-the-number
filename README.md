# Trúng Tim — Game đoán số

Website tĩnh triển khai theo đặc tả FINAL V7. Game chọn ngẫu nhiên một số từ 1–100 và có ba cấp độ: Mầm Non, Tiên Tri, Thần Thánh.

Ba kỹ năng trong game: **Chẵn Hay Lẻ**, **Loại Một Nửa** và **Đổi Gợi Ý**.

## Chạy trên máy

Mở PowerShell hoặc Terminal tại thư mục dự án:

```powershell
py -m http.server 8000
```

Truy cập `http://localhost:8000`.

## Cấu trúc

```text
index.html
css/style.css
js/config.js
js/hints.js
js/skills.js
js/game.js
```

## Đưa lên GitHub Pages

1. Tạo repository mới.
2. Đưa toàn bộ nội dung thư mục này lên nhánh `main`.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**.
5. Chọn `main` và `/(root)`, sau đó bấm **Save**.

Không cần chạy lệnh build. `index.html` là điểm vào của website.
