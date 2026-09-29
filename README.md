# NEXUS//OS — Sci-Fi Portfolio

Website portfolio phong cách "hệ điều hành viễn tưởng", viết bằng **React 18 + Vite**, **Framer Motion**, **GSAP** và **HTML5 Canvas**.
"NEXUS//OS" chỉ là tên trang trí của giao diện, không phải framework.

## Chạy thử

```bash
npm install      # chỉ cần chạy 1 lần
npm run dev      # mở http://localhost:5173 — sửa file là trang tự cập nhật
npm run build    # tạo bản hoàn chỉnh vào thư mục dist/ để đưa lên hosting
```

Cần Node.js 18 trở lên. File `preview.html` là bản xem nhanh, mở trực tiếp bằng trình duyệt được (không tự cập nhật khi sửa code).

---

## Sửa code bằng VS Code + xem trực tiếp

1. Mở VS Code → **File → Open Folder…** → chọn `D:\web`.
2. Mở terminal trong VS Code: **Terminal → New Terminal** (hoặc `` Ctrl + ` ``).
3. Lần đầu: gõ `npm install`. Rồi trong khung Explorer bên trái, **chuột phải thư mục `vscode-config` → Rename → đổi tên thành `.vscode`** (có dấu chấm ở đầu) để bật nút F5 và các task bên dưới.
4. Chạy website — chọn 1 trong 3 cách:
   - Nhấn **F5** → website chạy và tự mở Chrome (đổi sang Edge ở ô chọn trên cùng của tab *Run and Debug*).
   - Nhấn **Ctrl + Shift + B** → website chạy, mở http://localhost:5173 bằng trình duyệt bất kỳ.
   - Gõ `npm run dev` trong terminal → trình duyệt tự mở.
5. Sửa file rồi **Ctrl + S** → trang tự cập nhật ngay, không cần tải lại.
6. Dừng website: bấm vào terminal đang chạy rồi nhấn **Ctrl + C** (hoặc **Shift + F5** nếu chạy bằng F5).

Muốn xem ngay trong VS Code: `Ctrl + Shift + P` → gõ **Simple Browser: Show** → nhập `http://localhost:5173`, rồi kéo tab đó sang bên phải để chia đôi màn hình (code bên trái, trang bên phải).

### Rê chuột lên trang → nhảy tới đúng dòng code

Khi đang chạy `npm run dev`:

- **Giữ `Shift + Alt`** (Mac: `Option + Shift`) và rê chuột lên bất kỳ phần nào của trang → hiện khung ghi tên file và số dòng, ví dụ `src/sections/Dashboard.jsx:40`.
- **Bấm chuột** (vẫn giữ phím) → VS Code mở đúng file, đúng dòng đó.
- Hoặc bấm **nút tròn nhỏ ở mép phải màn hình** để bật chế độ này mà không cần giữ phím.

Lưu ý: công cụ chỉ ra *nơi hiển thị* (file giao diện). Nếu ở đó ghi kiểu `{profile.name}` hay `{tr(profile.bio)}` thì nội dung thật nằm trong `src/data/profile.js`; kiểu `{t('dash.brief')}` thì chữ nằm trong `src/i18n/translations.js`.
Nếu bấm mà VS Code không mở: trong VS Code nhấn `Ctrl + Shift + P` → **Shell Command: Install 'code' command in PATH**, rồi chạy lại `npm run dev`.
Công cụ này chỉ có khi chạy `npm run dev`, không nằm trong bản `npm run build` đưa lên mạng.

### Màn hình khởi động

Đang tắt: website mở thẳng vào trang chính. Muốn bật lại màn hình "TRUY CẬP ĐƯỢC CẤP": trong `src/App.jsx` đổi `SHOW_BOOT = false` thành `true`.

### Con trỏ chuột

Đang dùng con trỏ mặc định. Muốn bật lại con trỏ tâm ngắm: trong `src/App.jsx` đổi `USE_CUSTOM_CURSOR = false` thành `true`.

---

## Tự nhập nội dung ngay trên trang

Có **2 chỗ** để chỉnh sửa — cùng các nút như nhau:
- **Trên máy**: chạy `npm run dev` → trang tự bật chế độ chỉnh sửa.
- **Trên web thật** (sau khi đã đưa lên GitHub): mở **https://vudinhdat02.github.io/#admin** → đăng nhập bằng mã truy cập GitHub (xem mục *Chỉnh sửa trực tiếp trên web thật* bên dưới).

Các mục sửa được:

- **Dự án** (trang Dự án): nút **"+ Thêm dự án"** → ảnh / ảnh chụp màn hình (nhiều ảnh, ảnh đầu là ảnh bìa, luôn hiện trọn không bị cắt), tên, năm, loại, mô tả tiếng Việt (+ tiếng Anh nếu muốn), công nghệ, link GitHub / demo.
  Dưới mỗi dự án: nút **▦** = hiện ở mục *Dự án tiêu biểu* trang Tổng quan · nút **★** = *Dự án tâm đắc* (khung vàng lớn) · ↑ ↓ đổi thứ tự · ✎ sửa · 🗑 xóa. Lưu vào `src/data/projects.json`.

- **Thành tích**: nút **"+ Thêm thành tích"** → chọn ảnh, nhập tên, thời gian, **loại thành tích**, thông tin → **Lưu**.
  - *Thời gian* nên có năm (VD `09/2024`, `12/09/2024`, `2024`) — trang tự sắp xếp theo thời gian và chia mốc theo năm.
  - *Loại thành tích* (Chứng chỉ, Giải thưởng…): người xem bấm vào loại để lọc; có nút đổi *Mới nhất / Cũ nhất*.
  - Tick **"Hiện ở trang Tổng quan"** (hoặc bấm nút ★ **Nổi bật** trên từng thành tích) để đưa vào *Thành tích nổi bật* (trình chiếu 3D ở trang chủ). Nếu chọn ít hơn 3, trang tự thêm các thành tích mới nhất cho đủ.
  - Người xem chọn được **3 kiểu hiển thị**: *Dòng thời gian*, *Lưới thẻ*, *Trình chiếu 3D*.
  - Mỗi thành tích có nút **Sửa**, **Xóa** (bấm 2 lần để xác nhận). Bấm vào ảnh để phóng to.
  - Dữ liệu lưu vào `src/data/achievements.json`, ảnh lưu vào `public/uploads/` (ảnh lớn được tự thu nhỏ).
- **Giới thiệu** (trang Tổng quan): nút **"+ Thêm mục giới thiệu"** → tên năng lực + mô tả. Lưu vào `src/data/intro.json`.
- **Kỹ năng** (trang Tổng quan): nút **"+ Thêm kỹ năng"** → tên + mô tả (VD: *Ngoại ngữ — Chứng chỉ B1*).
  Rê chuột vào một dòng để thấy nút ↑ ↓ ✎ 🗑. Lưu vào `src/data/skills.json`.
- **Nhật ký / Blog** (cuối trang Tổng quan): nút **"+ Viết bài mới"** → chọn nhiều ảnh cùng lúc (ảnh đầu là ảnh bìa, ← → để đổi thứ tự), tiêu đề, ngày, câu chuyện → **Đăng bài**.
  Bài mới nằm trên cùng. Lưu vào `src/data/blog.json`, ảnh vào `public/uploads/`.
  - **Kiểu trình bày**: chọn trong bảng *Kiểu trình bày* khi viết/sửa bài, hoặc đổi nhanh ở ô **Kiểu** ngay dưới bài (thấy ngay kết quả, không ưng thì chọn kiểu khác).
    *Tự động* = tự chọn kiểu hợp với hình dạng ảnh, 2 bài liền nhau không trùng kiểu. *Ảnh gốc* = giữ nguyên tỉ lệ ảnh, không bao giờ cắt.
  - **Hiện trọn ảnh (không cắt)**: bật cho bài nào mà ảnh bị cắt mất phần quan trọng.
- Trong ô mô tả: **Shift + Enter** = xuống dòng, **Enter** = lưu.
- **CV**: trang CV có nút **"Thay CV (PDF)"** → chọn file PDF mới. File lưu tại `public/cv.pdf`.

Người xem website **không thấy** các nút này — họ chỉ thấy nội dung.

## Sửa thông tin ở đâu?

Nội dung nằm trong `src/data/`:

| Muốn sửa | File |
|---|---|
| Tên, chức danh, đoạn giới thiệu, địa điểm, email, **mạng xã hội / số điện thoại** (mục `socials`), số liệu | `src/data/profile.js` |
| Các mục giới thiệu năng lực (nhập trên trang, hoặc sửa file) | `src/data/intro.json` |
| Dòng bản quyền ở cuối trang | khóa `foot.*` trong `src/i18n/translations.js` |
| Dự án (nhập trên trang, hoặc sửa file) | `src/data/projects.json` |
| Tên repo GitHub dùng cho chế độ quản trị trên web | `src/data/site.js` |
| Thành tích (nhập trên trang, hoặc sửa file) | `src/data/achievements.json` |
| Kỹ năng (nhập trên trang, hoặc sửa file) | `src/data/skills.json` |
| CV | `public/cv.pdf` |
| Chữ trên giao diện (tên menu, nút, tiêu đề…) bằng cả 2 ngôn ngữ | `src/i18n/translations.js` |

### Viết nội dung song ngữ

Mỗi đoạn chữ có thể viết theo 2 cách:

```js
role: 'Front-end Developer',                                    // 1 chữ, dùng cho cả 2 ngôn ngữ
role: { en: 'Front-end Developer', vi: 'Lập trình viên Front-end' }, // mỗi ngôn ngữ 1 bản
```

### Thêm mạng xã hội

Trong `src/data/profile.js`, mục `socials`, thêm một dòng:

```js
{ icon: 'youtube', label: 'YouTube', handle: 'Tên kênh', url: 'https://…' },
```

`icon` là một trong: `github`, `youtube`, `tiktok`, `instagram`, `mail`, `call`. Danh sách này hiện ở trang Tổng quan và trang Liên hệ.

### Form liên hệ

Mặc định form chạy chế độ demo (hiệu ứng gửi rồi hiện nút "Mở ứng dụng email").
Muốn nhận tin nhắn thật: tạo form miễn phí trên [Formspree](https://formspree.io), rồi dán link vào `contactEndpoint` trong `src/data/profile.js`.

### Đổi tên "NEXUS//OS"

Tìm chữ `NEXUS` trong `src/components/HUDHeader.jsx` (logo), `src/i18n/translations.js` (màn khởi động, terminal) và `index.html` (tiêu đề tab).

### Đổi màu

Bảng màu nằm đầu file `src/styles/global.css`: khối `:root, [data-theme="dark"]` cho nền tối và `:root[data-theme="light"]` cho nền sáng.

---

## Đưa website lên mạng miễn phí (GitHub Pages)

Website sẽ có địa chỉ **https://vudinhdat02.github.io** — không cần mua tên miền.
Dự án đã có sẵn file `.github/workflows/deploy.yml`: mỗi lần bạn đẩy code lên GitHub, website tự build và cập nhật sau khoảng 1–2 phút.

### Lần đầu (làm 1 lần)

**Cách nhanh:** nhấn đúp file **`dang-len-github-lan-dau.bat`** trong `D:\web` và làm theo chữ hiện ra. File này tự:
cài đặt thông tin Git, đổi tên `github-config` → `.github`, mở trang tạo repo, đẩy code lên, rồi mở trang bật Pages.

Bạn chỉ cần:
1. Cài **Git** nếu chưa có: https://git-scm.com/download/win (bấm Next đến hết).
2. Khi trang tạo repo mở ra: tên **`Vudinhdat02.github.io`**, chọn **Public**, KHÔNG tick "Add a README" → **Create repository** → quay lại cửa sổ đen, nhấn phím bất kỳ.
3. Khi hiện cửa sổ đăng nhập GitHub → đăng nhập.
4. Khi trang **Settings → Pages** mở ra: mục *Source* chọn **GitHub Actions**.
5. Trang **Actions**: đợi dấu ✓ xanh (1–2 phút; nếu đỏ → bấm vào → **Re-run all jobs**).
6. Mở **https://vudinhdat02.github.io** — xong.

<details><summary>Hoặc tự gõ lệnh</summary>

Đổi tên thư mục `github-config` thành `.github`, rồi trong terminal VS Code:
```bash
git init
git add .
git commit -m "Portfolio"
git branch -M main
git remote add origin https://github.com/Vudinhdat02/Vudinhdat02.github.io.git
git push -u origin main
```
</details>

> Đặt tên repo khác (vd `web`) cũng được, khi đó địa chỉ là `https://vudinhdat02.github.io/web/` — file deploy tự xử lý đường dẫn (nhớ sửa tên repo trong 2 file `.bat`).

### Chỉnh sửa trực tiếp trên web thật (#admin)

Bạn sửa được ngay trên https://vudinhdat02.github.io (cả trên điện thoại), người khác chỉ xem được.

**Tạo mã truy cập (1 lần, 2 phút):**
1. Mở https://github.com/settings/personal-access-tokens/new (đăng nhập GitHub).
2. *Token name*: `portfolio-admin` · *Expiration*: 90 ngày (hết hạn thì tạo mã mới).
3. *Repository access*: **Only select repositories** → chọn **Vudinhdat02.github.io**.
4. *Permissions* → *Repository permissions* → **Contents: Read and write** (để nguyên các mục khác).
5. **Generate token** → copy mã (bắt đầu bằng `github_pat_…`). GitHub chỉ hiện mã 1 lần — lưu vào trình quản lý mật khẩu nếu muốn.

**Đăng nhập:** mở **https://vudinhdat02.github.io/#admin** → dán mã → (tick *Ghi nhớ trên máy này* nếu là máy riêng của bạn) → **Đăng nhập**.
Góc phải hiện khung vàng **CHẾ ĐỘ QUẢN TRỊ** và toàn bộ nút thêm / sửa / xóa hiện ra như khi chạy trên máy.

**Khi bấm Lưu:** thay đổi được lưu thẳng vào repo GitHub (ảnh vào `public/uploads/`, nội dung vào `src/data/…json`).
Bạn thấy ngay; người xem thấy sau khoảng 1–2 phút — khung vàng báo *"Web công khai đã cập nhật ✓"* khi xong.

**Xong việc:** bấm **Đăng xuất** trong khung vàng (nhất là trên máy người khác).

**Mất máy / lộ mã:** vào https://github.com/settings/personal-access-tokens → chọn mã → **Delete**. Mã cũ lập tức vô dụng.

### Mỗi lần thêm / sửa / nâng cấp trên máy

1. Nếu vừa sửa trên web thật: nhấn đúp **`lay-ban-moi-tu-github.bat`** để kéo bài viết, ảnh… về máy trước.
2. `npm run dev` → thêm thành tích, viết blog, sửa code… như bình thường.
3. Nhấn đúp **`cap-nhat-len-github.bat`** → gõ vài chữ mô tả thay đổi → Enter.
   (hoặc dùng khung **Source Control** bên trái VS Code: gõ nội dung → **Commit** → **Sync Changes**).
4. Khoảng 1–2 phút sau website trên mạng tự cập nhật.

### Bảo mật

- Website trên mạng là **trang tĩnh** (GitHub Pages): không có máy chủ, không có mật khẩu nào nằm trong code. Người xem **không thể** sửa hay xóa nội dung.
- Chế độ quản trị (#admin) không "tin" trình duyệt: mọi lần lưu đều do **GitHub** kiểm tra — chỉ mã truy cập của chính tài khoản bạn, có quyền ghi vào đúng repo này, mới được chấp nhận. Người khác mở #admin cũng không làm được gì.
- Mã truy cập nên là loại **Fine-grained**, **chỉ 1 repo**, **chỉ quyền Contents**, **có hạn dùng** — đúng khuyến nghị của GitHub. Mã chỉ lưu trong trình duyệt của bạn (không tick "Ghi nhớ" thì đóng tab là mất). Không bao giờ dán mã vào code, tin nhắn hay gửi cho ai.
- Website có sẵn chính sách bảo mật nội dung (Content-Security-Policy): chỉ chạy code của chính website và chỉ được gửi dữ liệu tới GitHub — giảm nguy cơ mã bị đánh cắp.
- Vì vậy hãy giữ tài khoản GitHub an toàn: mật khẩu mạnh + bật **xác thực 2 lớp** (GitHub → Settings → Password and authentication → Two-factor authentication). Không thêm người lạ làm Collaborator.
- Repo công khai nên **mọi file trong dự án ai cũng xem được** (code, ảnh trong `public/uploads`, số điện thoại, email). Đừng để giấy tờ riêng tư (CCCD, bảng điểm có số CMND…) vào dự án; che thông tin nhạy cảm trên ảnh giấy khen nếu có.
- Không bao giờ ghi mật khẩu / khóa API vào code. Nếu sau này cần, đặt trong file `.env` — file này đã bị chặn không đưa lên GitHub (`.gitignore`).

## Ngôn ngữ & giao diện sáng/tối

- Nút **EN | VI** và nút **☀ / ☾** ở góc phải thanh trên cùng. Âm thanh luôn bật (trình duyệt chỉ phát tiếng sau lần bấm đầu tiên).
- Lựa chọn được lưu lại cho lần truy cập sau. Lần đầu, ngôn ngữ theo cài đặt của trình duyệt; giao diện mặc định là **nền trắng**.
- Trong terminal: `lang vi`, `lang en`, `theme light`, `theme dark`.
- Font: **Chakra Petch** (tiêu đề) + **Saira** (chữ thường) + **JetBrains Mono** (chữ kỹ thuật) — cả 3 đều có đủ dấu tiếng Việt, nên tiếng Anh hay tiếng Việt đều hiển thị đúng. Đổi font ở đầu file `src/styles/global.css` và dòng tải font trong `index.html`.

## Cấu trúc thư mục

```
src/
  App.jsx                     khung chính: khởi động → OS, chuyển trang, hiệu ứng glitch, vuốt trên mobile
  context/SettingsContext.jsx ngôn ngữ + giao diện sáng/tối (t() cho chữ giao diện, tr() cho dữ liệu song ngữ)
  context/SoundContext.jsx    âm thanh tổng hợp bằng Web Audio + bật/tắt
  i18n/translations.js        toàn bộ chữ giao diện EN / VI
  data/                       nội dung của bạn (profile, projects, achievements, skills, intro, blog)
  hooks/                      useDevice (pointer:coarse), useTilt, useSwipe, useCountUp, useClock
  components/
    CyberBackground.jsx       nền canvas: lưới hạt, mạch điện, camera (đổi màu theo giao diện)
    Cursor.jsx                con trỏ tâm ngắm + vệt sáng (chỉ trên máy tính)
    TouchFeedback.jsx         gợn sóng khi chạm + rung
    BootSequence.jsx          màn khởi động
    HUDHeader.jsx             logo, menu, nút ngôn ngữ / giao diện
    SocialLinks.jsx           danh sách mạng xã hội (icon + nền tảng | tên kênh)
    IntroList.jsx             các mục giới thiệu năng lực
    SiteFooter.jsx            dòng bản quyền cuối trang
    Coverflow.jsx             trình chiếu 3D (Thành tích tiêu biểu, kiểu xem Trình chiếu)
    ProjectArt.jsx            ảnh bìa dự án (ảnh thật hoặc hình mạch điện tự tạo)
    SettingsToggles.jsx       nút EN|VI và nút sáng/tối
    OSWindow.jsx, SkillOrbit.jsx, Terminal.jsx, Icons.jsx
  sections/                   Dashboard, Projects (+ FeaturedProjects: lưới bento ở trang chủ), Contact
  blog/                       mục Nhật ký (mỗi bài một kiểu trình bày + hiệu ứng)
  achievements/               trang "Thành tích" (dòng xen kẽ ảnh trái/phải, phóng to ảnh, trình nhập)
  sections/CV.jsx             trang CV (hiển thị public/cv.pdf bằng pdf.js)
  admin/                      trình chỉnh sửa trên trang + đăng nhập quản trị (#admin) trên web thật
  vite-plugins/admin-api.js   phần lưu dữ liệu vào file khi npm run dev
```

## Phím tắt

`1–4` chuyển trang · `` ` `` mở terminal · `/` tìm thành tích · `← / →` xem hồ sơ trước/sau trong cửa sổ chi tiết · `Esc` đóng.
