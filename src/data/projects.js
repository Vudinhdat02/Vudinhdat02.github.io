/* ============================================================
 *  DỰ ÁN / PROJECTS
 *  Dữ liệu nằm trong src/data/projects.json — thêm / sửa / xóa ngay trên trang "Dự án"
 *  (khi chạy npm run dev, hoặc trên web thật sau khi đăng nhập #admin).
 *
 *  Mỗi dự án: title, category (MOBILE | IOT | WEB | loại khác), year, desc ({ vi, en } hoặc chữ thường),
 *  tags, repo (link GitHub), demo (link chạy thử), images (ảnh, ảnh đầu = ảnh bìa),
 *  featured: true → "Dự án tâm đắc" (khung lớn màu vàng)
 *  pinned:   true → hiện ở mục "Dự án tiêu biểu" trang Tổng quan
 * ============================================================ */
import data from './projects.json';

export const projects = data;
export const PROJECT_CATEGORIES = ['MOBILE', 'IOT', 'WEB'];
