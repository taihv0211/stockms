/* ============================================================
   DỮ LIỆU MẪU + QUYỀN DÙNG CHUNG
   Toàn bộ số liệu ở đây là dữ liệu giả để xem giao diện.
   Muốn đổi quyền của từng tài khoản: sửa APT.ROLES bên dưới.
   ============================================================ */
(function (g) {
  'use strict';
  var APT = g.APT = g.APT || {};

  /* ---------- lưu tạm trên trình duyệt (có dự phòng nếu bị chặn) ---------- */
  var mem = {};
  APT.store = {
    get: function (k, def) {
      try {
        var v = g.localStorage.getItem('apt.' + k);
        if (v !== null) return JSON.parse(v);
      } catch (e) {}
      return k in mem ? mem[k] : def;
    },
    set: function (k, v) {
      mem[k] = v;
      try { g.localStorage.setItem('apt.' + k, JSON.stringify(v)); } catch (e) {}
    },
    clearAll: function () {
      mem = {};
      try {
        Object.keys(g.localStorage)
          .filter(function (k) { return k.indexOf('apt.') === 0; })
          .forEach(function (k) { g.localStorage.removeItem(k); });
      } catch (e) {}
    }
  };

  /* ---------- tiện ích ---------- */
  APT.fmt = function (n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  APT.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  APT.now = function () {
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  APT.todayISO = function () {
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  /* ---------- ẤN PHẨM ----------
     nhom + ct = hai dòng tiêu đề cột như bản vẽ khách hàng.
     seri  = loại có số seri (hộ chiếu, thị thực...).
     ngoai / trong = nơi sử dụng.  scale = chỉ để sinh số mẫu.        */
  function P(id, nhom, ct, seri, ngoai, trong, scale) {
    return { id: id, nhom: nhom, ct: ct, ten: (nhom + ' ' + ct).replace(/\s+/g, ' ').trim(), seri: seri, ngoai: ngoai, trong: trong, scale: scale };
  }
  var BASE_PRODUCTS = [
    P('hcng-kc',  'HCNG', 'không chip', true, true, true, 300),
    P('hccv-kc',  'HCCV', 'không chip', true, true, true, 800),
    P('hcpt-kc',  'HCPT', 'không chip', true, true, false, 60000),
    P('hcrg',     'HCRG', '', true, true, false, 9000),
    P('hcng-cc',  'HCNG', 'có chip', true, true, true, 200),
    P('hccv-cc',  'HCCV', 'có chip', true, true, true, 400),
    P('hcpt-cc',  'HCPT', 'có chip', true, true, false, 20000),
    P('tt-dan',   'THỊ THỰC', 'Dán', true, true, true, 15000),
    P('tt-roi',   'THỊ THỰC', 'Rời', true, true, true, 300000),
    P('mtt-dan',  'MIỄN THỊ THỰC', 'Dán', true, true, false, 40000),
    P('mtt-roi',  'MIỄN THỊ THỰC', 'Rời', true, true, false, 40000),
    P('tem-ab',   'TEM AB', '', false, true, false, 3000),
    P('ks-knd',   'KHAI SINH', 'Không nội dung', false, true, false, 8000),
    P('sks-knd',  'SAO KHAI SINH', 'Không nội dung', false, true, true, 9000),
    P('kh-knd',   'KẾT HÔN', 'Không nội dung', false, true, false, 3000),
    P('ks-cnd',   'KHAI SINH', 'Có nội dung', false, true, false, 5000),
    P('sks-cnd',  'SAO KHAI SINH', 'Có nội dung', false, true, true, 6000),
    P('kh-cnd',   'KẾT HÔN', 'Có nội dung', false, true, false, 2000),
    P('so-ks',    'SỔ KHAI SINH', '', false, true, false, 500),
    P('so-kt',    'SỔ KHAI TỬ', '', false, true, false, 500),
    P('so-kh',    'SỔ KẾT HÔN', '', false, true, false, 500),
    P('tem-hph24','TEM HPH', '(mẫu 2024)', false, true, false, 6000),
    P('tem-hph26','TEM HPH', '(mẫu 2026)', false, true, false, 6000),
    P('tem-hph',  'TEM HPH', '', false, false, true, 4000)
  ];
  APT.allProducts = function () { return BASE_PRODUCTS.concat(APT.store.get('products', [])); };
  /* kind = 'ngoai' | 'trong' → danh sách cột theo đúng thứ tự (1), (2), (3)... */
  APT.products = function (kind) {
    return APT.allProducts().filter(function (p) { return p[kind]; });
  };
  APT.addProduct = function (ten, seri, ngoai, trong) {
    var list = APT.store.get('products', []);
    list.push({ id: 'x' + Date.now(), nhom: ten, ct: '', ten: ten, seri: seri, ngoai: ngoai, trong: trong, scale: 1000 });
    APT.store.set('products', list);
  };

  /* ---------- 97 CƠ QUAN ĐẠI DIỆN (lấy từ file Excel "Tổng hợp CQĐD nhận") ---------- */
  APT.ORGS = ["Đại sứ quán Việt Nam tại Argentina", "Đại sứ quán Việt Nam tại Ai Cập", "Đại sứ quán Việt Nam tại Ai-len", "Đại sứ quán Việt Nam tại Ấn Độ", "Đại sứ quán Việt Nam tại Angola", "Đại sứ quán Việt Nam tại Algerie", "Đại sứ quán Việt Nam tại Anh", "Đại sứ quán Việt Nam tại Áo", "Đại sứ quán Việt Nam tại A-rập Xê-út", "Đại sứ quán Việt Nam tại Ba Lan", "Đại sứ quán Việt Nam tại Belarus", "Đại sứ quán Việt Nam tại Bỉ", "Đại sứ quán Việt Nam tại Bồ Đào Nha", "Đại sứ quán Việt Nam tại Braxin", "Đại sứ quán Việt Nam tại Brunei", "Đại sứ quán Việt Nam tại Bulgaria", "Đại sứ quán Việt Nam tại Ca Ta", "Đại sứ quán Việt Nam tại Các Tiểu Vương Quốc Ả-Rập Thống Nhất", "Đại sứ quán Việt Nam tại Campuchia", "Đại sứ quán Việt Nam tại Canada", "Đại sứ quán Việt Nam tại Chile", "Đại sứ quán Việt Nam tại Kuwait", "Đại sứ quán Việt Nam tại Cuba", "Đại sứ quán Việt Nam tại Đan Mạch", "Đại sứ quán Việt Nam tại Đức", "Đại sứ quán Việt Nam tại Hà Lan", "Đại sứ quán Việt Nam tại Hàn Quốc", "Đại sứ quán Việt Nam tại Hoa Kỳ", "Đại sứ quán Việt Nam tại Hungarie", "Đại sứ quán Việt Nam tại Hy Lạp", "Đại sứ quán Việt Nam tại Bangladesh", "Đại sứ quán Việt Nam tại Indonesia", "Đại sứ quán Việt Nam tại Iran", "Đại sứ quán Việt Nam tại Italia", "Đại sứ quán Việt Nam tại Israel", "Đại sứ quán Việt Nam tại Cazăcstan", "Đại sứ quán Việt Nam tại Lào", "Đại sứ quán Việt Nam tại Malaysia", "Đại sứ quán Việt Nam tại Maroc", "Đại sứ quán Việt Nam tại Mehico", "Đại sứ quán Việt Nam tại Myanmar", "Đại sứ quán Việt Nam tại Mông Cổ", "Đại sứ quán Việt Nam tại Mozambique", "Đại sứ quán Việt Nam tại Nauy", "Đại sứ quán Việt Nam tại Nam Phi", "Đại sứ quán Việt Nam tại Nga", "Đại sứ quán Việt Nam tại Nhật Bản", "Đại sứ quán Việt Nam tại Nigeria", "Đại sứ quán Việt Nam tại New Zealand", "Đại sứ quán Việt Nam tại Australia", "Đại sứ quán Việt Nam tại Pakistan", "Đại sứ quán Việt Nam tại Phần Lan", "Đại sứ quán Việt Nam tại Pháp", "Đại sứ quán Việt Nam tại Philippine", "Đại sứ quán Việt Nam tại Rumanie", "Đại sứ quán Việt Nam tại Séc", "Đại sứ quán Việt Nam tại Tanzania", "Đại sứ quán Việt Nam tại Tây Ban Nha", "Đại sứ quán Việt Nam tại Thái Lan", "Đại sứ quán Việt Nam tại Thổ Nhĩ Kỳ", "Đại sứ quán Việt Nam tại Thụy Điển", "Đại sứ quán Việt Nam tại Thụy Sĩ", "Đại sứ quán Việt Nam tại Triều Tiên", "Đại sứ quán Việt Nam tại Trung Quốc", "Đại sứ quán Việt Nam tại Ucraina", "Đại sứ quán Việt Nam tại Venezuela", "Đại sứ quán Việt Nam tại Singapore", "Đại sứ quán Việt Nam tại Slovakia", "Đại sứ quán Việt Nam tại Srilanka", "Phái đoàn thường trực Việt Nam tại Liên hợp quốc, Hoa Kỳ", "Phái đoàn thường trực Việt Nam tại Geneve, Thụy Sỹ", "Tổng Lãnh sự quán tại Busan, Hàn Quốc", "Tổng Lãnh sự quán tại Battambang, Campuchia", "Tổng Lãnh sự quán tại Côn Minh, Trung Quốc", "Tổng Lãnh sự quán tại Ekaterinburg, Nga", "Tổng Lãnh sự quán tại Fukuoka, Nhật Bản", "Tổng Lãnh sự quán tại Hồng Kông, Trung Quốc", "Tổng Lãnh sự quán tại Houston, Hoa Kỳ", "Tổng Lãnh sự quán tại Khon Ken, Thái Lan", "Tổng Lãnh sự quán tại Luang Prabang, Lào", "Tổng Lãnh sự quán tại Mumbai, Ấn Độ", "Tổng Lãnh sự quán tại Nam Ninh, Trung Quốc", "Tổng Lãnh sự quán tại Osaka, Nhật Bản", "Tổng Lãnh sự quán tại Pacse, Lào", "Tổng Lãnh sự quán tại Frankfurt, Đức", "Tổng Lãnh sự quán tại Perth, Australia", "Tổng Lãnh sự quán tại Quảng Châu, Trung Quốc", "Tổng Lãnh sự quán tại Thượng Hải, Trung Quốc", "Tổng Lãnh sự quán tại Vancover, Canada", "Tổng Lãnh sự quán tại Vladivoxtoc, Nga", "Tổng Lãnh sự quán tại San Francisco, Hoa Kỳ", "Tổng Lãnh sự quán tại Savanakhet, Lào", "Tổng Lãnh sự quán tại Sihanoukville, Campuchia", "Tổng Lãnh sự quán tại Sydney, Australia", "Tổng Lãnh sự quán tại Trùng Khánh, Trung Quốc", "Văn phòng Kinh tế-Văn hoá Việt Nam tại Đài Bắc, Trung Quốc", "Đại sứ quán Việt Nam tại Timor-Leste"];

  /* ---------- ĐƠN VỊ (màn hình "Quản lý tham số → Tên đơn vị") ----------
     cap = được xuất/cấp,  nhan = được nhận,  noibo = phòng ban trong Cục */
  var UNITS_BASE = [
    { ten: 'Cục Lãnh sự (VPC)', cap: true, nhan: true, noibo: true },
    { ten: 'Cục Quản lý xuất nhập cảnh (QLXNC)', cap: true, nhan: false },
    { ten: 'Nhà máy in BTP', cap: true, nhan: false },
    { ten: 'H09', cap: true, nhan: false },
    { ten: 'Phòng XNC', cap: true, nhan: true, noibo: true },
    { ten: 'Phòng LSNN', cap: true, nhan: true, noibo: true },
    { ten: 'Phòng HPH', cap: true, nhan: true, noibo: true },
    { ten: 'Sở Ngoại vụ TP. Hồ Chí Minh', cap: false, nhan: true }
  ];
  APT.units = function () {
    var orgs = APT.ORGS.map(function (t) { return { ten: t, cap: false, nhan: true, cqdd: true }; });
    return UNITS_BASE.concat(orgs, APT.store.get('units', []));
  };
  APT.addUnit = function (ten, cap, nhan) {
    var list = APT.store.get('units', []);
    list.push({ ten: ten, cap: cap, nhan: nhan });
    APT.store.set('units', list);
  };
  function extraNhan() {
    return APT.store.get('units', []).filter(function (u) { return u.nhan; }).map(function (u) { return u.ten; });
  }
  APT.listNguon = function () {   // Nhập kho: ai giao hàng cho Cục
    return UNITS_BASE.filter(function (u) { return u.cap && !u.noibo; }).map(function (u) { return u.ten; })
      .concat(APT.store.get('units', []).filter(function (u) { return u.cap; }).map(function (u) { return u.ten; }));
  };
  APT.listNhanNgoai = function () { return APT.ORGS.concat(extraNhan()); };
  APT.listNhanTrong = function () {
    return ['Phòng XNC', 'Phòng LSNN', 'Phòng HPH', 'Sở Ngoại vụ TP. Hồ Chí Minh'].concat(extraNhan());
  };
  APT.listNoiBo = function () { return ['Cục Lãnh sự (VPC)', 'Phòng XNC', 'Phòng LSNN', 'Phòng HPH']; };

  /* ---------- MENU + QUYỀN ---------- */
  APT.PAGES = [
    { id: 'tong-quan',   ten: 'Tổng quan',         href: 'tong-quan.html' },
    { id: 'xuat-kho',    ten: 'Xuất kho CLS',      href: 'xuat-kho.html' },
    { id: 'nhap-kho',    ten: 'Nhập kho CLS',      href: 'nhap-kho.html' },
    { id: 'giao-nhan',   ten: 'Báo cáo giao nhận', href: 'giao-nhan.html' },
    { id: 'su-dung',     ten: 'Báo cáo sử dụng',   href: 'su-dung.html' },
    { id: 'tra-cuu',     ten: 'Tra cứu APT',       href: 'tra-cuu.html' },
    { id: 'dieu-chuyen', ten: 'Điều chuyển APT',   href: 'dieu-chuyen.html' },
    { id: 'chon-so',     ten: 'Chọn số hộ chiếu',  href: 'chon-so.html' },
    { id: 'tham-so',     ten: 'Quản lý tham số',   href: 'tham-so-an-pham.html' },
    { id: 'tai-khoan',   ten: 'Quản lý tài khoản', href: 'tai-khoan.html' }
  ];

  /* pages: màn hình được vào.  scope: nhìn được ngoài nước / trong nước.
     act.lap = lập + xác nhận phiếu;  duyetVP / duyetCuc = duyệt ở từng bước;
     org = chỉ thấy số liệu của đúng 1 cơ quan.                              */
  var ALL = ['xuat-kho', 'nhap-kho', 'giao-nhan', 'su-dung', 'tra-cuu', 'dieu-chuyen'];
  APT.ROLES = {
    admin: { ten: 'Admin', user: 'admin', pages: '*', scope: 'both', home: 'tong-quan.html',
      mota: 'Toàn quyền: xem tất cả, lập phiếu, duyệt mọi bước, quản lý tham số và tài khoản.',
      act: { lap: true, duyetVP: true, duyetCuc: true, quanLy: true, capSo: true } },
    ctr: { ten: 'Lãnh đạo Cục 1 (LĐC1)', user: 'ctr', pages: ['tong-quan'].concat(ALL, ['chon-so']), scope: 'both', home: 'tong-quan.html',
      mota: 'Xem tất cả số liệu. Duyệt phiếu xuất kho ở bước Lãnh đạo Cục. Cấp số hộ chiếu đẹp.',
      act: { duyetCuc: true, capSo: true } },
    pctr: { ten: 'Lãnh đạo Cục 2 (LĐC2)', user: 'pctr', pages: ['tong-quan'].concat(ALL, ['chon-so']), scope: 'both', home: 'tong-quan.html',
      mota: 'Xem tất cả số liệu. Duyệt phiếu xuất kho ở bước Lãnh đạo Cục. Cấp số hộ chiếu đẹp.',
      act: { duyetCuc: true, capSo: true } },
    kho: { ten: 'Thủ kho', user: 'kho', pages: ALL, scope: 'both', home: 'xuat-kho.html',
      mota: 'Lập phiếu xuất kho, nhập kho, điều chuyển. Xem báo cáo và tra cứu seri.',
      act: { lap: true } },
    vp: { ten: 'Văn phòng (VP)', user: 'vp', pages: ['xuat-kho', 'giao-nhan', 'su-dung', 'tra-cuu', 'dieu-chuyen'], scope: 'both', home: 'xuat-kho.html',
      mota: 'Duyệt phiếu xuất kho ở bước Lãnh đạo VP. Xem báo cáo.',
      act: { duyetVP: true } },
    lsnn: { ten: 'Phòng LSNN', user: 'lsnn', pages: ['su-dung', 'tra-cuu', 'dieu-chuyen', 'chon-so'], scope: 'trong', home: 'dieu-chuyen.html',
      mota: 'Nhận và điều chuyển ấn phẩm trong nước, xem danh sách số hộ chiếu đẹp, xem báo cáo sử dụng trong nước.',
      act: { lap: true } },
    xnc: { ten: 'Phòng XNC', user: 'xnc', pages: ['su-dung', 'tra-cuu', 'dieu-chuyen', 'chon-so'], scope: 'trong', home: 'dieu-chuyen.html',
      mota: 'Nhận và điều chuyển ấn phẩm trong nước, xem danh sách số hộ chiếu đẹp, xem báo cáo sử dụng trong nước.',
      act: { lap: true } },
    ant: { ten: 'ĐSQVN tại Anh', user: 'ant', pages: ['giao-nhan', 'su-dung', 'tra-cuu'], scope: 'ngoai', home: 'giao-nhan.html',
      org: 'Đại sứ quán Việt Nam tại Anh',
      mota: 'Chỉ xem số liệu giao nhận và sử dụng của chính cơ quan mình.',
      act: {} }
  };
  APT.ROLE_ORDER = ['admin', 'ctr', 'pctr', 'kho', 'vp', 'lsnn', 'xnc', 'ant'];

  /* ---------- SỐ LIỆU MẪU (cố định, không ngẫu nhiên giữa các lần mở) ---------- */
  function h(s) {
    var x = 2166136261;
    for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995); x ^= x >>> 15;
    return (x >>> 0) / 4294967296;
  }
  function unit(p) { return p.scale >= 5000 ? 100 : (p.scale >= 500 ? 10 : 1); }
  function rnd(n, u) { return Math.round(n / u) * u; }
  function cell(salt, i, p, frac, zeroP) {
    if (h('z' + salt + i + '|' + p.id) < zeroP) return 0;
    var big = h('b' + i) < 0.15 ? 3 : 1;
    var v = rnd(p.scale * frac * big * (0.2 + h(salt + i + '|' + p.id) * 1.8), unit(p));
    return Math.max(unit(p), v);
  }
  function duToan(i, p) { return i < 0 ? rnd(p.scale * 0.6 * (0.8 + h('dtT' + p.id)), unit(p)) : cell('dt', i, p, 0.09, 0.25); }
  function daNhan(i, p) {
    var d = duToan(i, p);
    return rnd(d * (0.1 + 0.9 * h('dn' + i + '|' + p.id)), unit(p));
  }
  APT.data = {
    rand: h,
    khoNgoai: function (p) { return rnd(p.scale * (1 + h('kn' + p.id) * 4), unit(p)); },
    khoTrong: function (p) { return rnd(p.scale * 0.4 * (1 + h('kt' + p.id) * 3), unit(p)); },
    tonCQDD: function (i, p) { return cell('tc', i, p, 0.03, 0.4); },
    /* giao nhận: i = số thứ tự cơ quan, hoặc -1 cho trong nước */
    giaoNhan: function (i, p) {
      var du = duToan(i, p), da = Math.min(du, daNhan(i, p));
      return { du: du, da: da, con: du - da, pct: du ? Math.round(da * 100 / du) : null };
    },
    suDung: function (i, p) {
      var da = Math.min(duToan(i, p), daNhan(i, p));
      return rnd(da * (0.2 + 0.7 * h('sd' + i + '|' + p.id)), unit(p));
    }
  };

  /* ---------- SỐ SERI ĐÃ CẤP (cho Tra cứu APT) ---------- */
  APT.KY_HIEU = ['Q', 'P', 'G', 'N', 'B', 'C', 'D'];
  APT.SERI = [
    { sp: 'hcpt-kc', kh: 'Q', tu: 1000000, den: 1002499, cq: null },
    { sp: 'hcpt-kc', kh: 'Q', tu: 1002500, den: 1002999, cq: 'Đại sứ quán Việt Nam tại Thụy Sĩ' },
    { sp: 'hcpt-kc', kh: 'Q', tu: 1003000, den: 1003999, cq: 'Đại sứ quán Việt Nam tại Anh' },
    { sp: 'hcpt-kc', kh: 'Q', tu: 1004000, den: 1005999, cq: 'Đại sứ quán Việt Nam tại Pháp' },
    { sp: 'hcpt-cc', kh: 'P', tu: 2000001, den: 2000500, cq: 'Đại sứ quán Việt Nam tại Hàn Quốc' },
    { sp: 'hcng-kc', kh: 'G', tu: 10002569, den: 10002589, cq: 'Đại sứ quán Việt Nam tại Đức' },
    { sp: 'hcng-kc', kh: 'G', tu: 10002590, den: 10002689, cq: null },
    { sp: 'hccv-kc', kh: 'C', tu: 3000100, den: 3000199, cq: 'Đại sứ quán Việt Nam tại Nhật Bản' },
    { sp: 'tt-roi',  kh: 'N', tu: 5000001, den: 5100000, cq: 'Đại sứ quán Việt Nam tại Hoa Kỳ' }
  ];
  /* trả về { r: dải seri, stt: số thứ tự cơ quan | null } hoặc null nếu không có */
  APT.timSeri = function (pid, kh, soRaw) {
    var so = parseInt(String(soRaw).replace(/[^0-9]/g, ''), 10);
    if (isNaN(so)) return null;
    for (var i = 0; i < APT.SERI.length; i++) {
      var r = APT.SERI[i];
      if (r.sp === pid && r.kh === String(kh).toUpperCase() && so >= r.tu && so <= r.den) {
        return { r: r, stt: r.cq ? APT.ORGS.indexOf(r.cq) + 1 : null };
      }
    }
    return null;
  };
})(window);
