export const profile = {
  name: 'VU DINH DAT',
  avatar: '/dat.jpg',
  codename: 'dathoaqua',
  role: { en: 'Software R&D Engineer - IoT', vi: 'Kỹ sư nghiên cứu và phát triển phần mềm - IOT' },
  location: { en: 'Thai Nguyen Province, VN', vi: 'T.Thái Nguyên, VN' },
  bio: {
    en: 'Hello! 🚀 I am a Software & IoT Engineer specializing in building comprehensive solutions—ranging from mobile app and IoT 💡 development to backend systems, APIs, and web interfaces. Focused on optimizing performance and reliability ⚡, I am ready to partner with you to turn your tech ideas into real-world solutions! 🤝.',
    vi: 'Xin chào! 🚀 Tôi là một Kỹ sư Phần mềm & IoT, chuyên xây dựng các giải pháp toàn diện từ lập trình phần mềm di động, IoT 💡 đến phát triển hệ thống Backend, API và giao diện Web. Với định hướng tối ưu hiệu năng và độ tin cậy ⚡, tôi luôn sẵn sàng đồng hành cùng bạn biến những ý tưởng công nghệ thành giải pháp thực tế! 🤝.',
  },
  stats: [
    { label: { en: 'YEARS ACTIVE', vi: 'NĂM KINH NGHIỆM' }, value: '05+' }
  ],
  // Mạng xã hội & liên lạc — hiện ở trang Tổng quan và trang Liên hệ.
  // icon: github | instagram | tiktok | youtube | mail | call ; label = tên nền tảng ; handle = tên kênh / tài khoản
  socials: [
    { icon: 'github', label: 'GitHub', handle: 'Vudinhdat02', url: 'https://github.com/Vudinhdat02' },
    { icon: 'youtube', label: 'YouTube', handle: 'Vũ Đình Đạt Official', url: 'https://www.youtube.com/@vudinhdat02' },
    { icon: 'tiktok', label: 'TikTok', handle: '@datuav', url: 'https://www.tiktok.com/@datuav' },
    { icon: 'instagram', label: 'Instagram', handle: '@tadhniduv', url: 'https://www.instagram.com/tadhniduv' },
    { icon: 'mail', label: 'Email', handle: 'vudinhdat02@gmail.com', url: 'mailto:vudinhdat02@gmail.com' },
    { icon: 'call', label: { en: 'Phone', vi: 'Điện thoại' }, handle: '0332 465 590', url: 'tel:+84332465590' },
  ],
  email: 'vudinhdat02@gmail.com', // dùng cho nút "Mở ứng dụng email" ở trang Liên hệ
  contactEndpoint: '',
};

/* Kỹ năng đã chuyển sang src/data/skills.json — sửa trực tiếp trên trang (khi chạy npm run dev) hoặc trong file đó. */
