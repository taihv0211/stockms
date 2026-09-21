/* ============================================================
   KHUNG TRANG: menu bên trái, chọn quyền xem thử, tab, dựng bảng.
   Mỗi trang gọi APT.mount(idTrang, tiêuĐề) rồi đổ nội dung vào.
   ============================================================ */
(function (g) {
  'use strict';
  var APT = g.APT, esc = APT.esc, fmt = APT.fmt;

  /* ---------- quyền hiện tại ---------- */
  function readRole() {
    var m = /[?&]role=([a-z0-9]+)/.exec(g.location.search);
    if (m && APT.ROLES[m[1]]) APT.store.set('role', m[1]);
    var k = APT.store.get('role', null);
    return k && APT.ROLES[k] ? k : null;
  }
  APT.can = function (role, pageId) {
    return role.pages === '*' || role.pages.indexOf(pageId) >= 0;
  };

  /* ---------- dựng khung ---------- */
  APT.mount = function (pageId, title) {
    var key = readRole();
    if (!key) { g.location.replace('index.html'); return null; }
    var role = APT.ROLES[key];
    APT.roleKey = key; APT.role = role;

    var nav = APT.PAGES.filter(function (p) { return APT.can(role, p.id); }).map(function (p) {
      return '<a href="' + p.href + '"' + (p.id === pageId ? ' class="on" aria-current="page"' : '') + '>' + esc(p.ten) + '</a>';
    }).join('');
    var opts = APT.ROLE_ORDER.map(function (k) {
      return '<option value="' + k + '"' + (k === key ? ' selected' : '') + '>' + esc(APT.ROLES[k].ten) + '</option>';
    }).join('');

    document.title = title + ' · Quản lý APT';
    document.body.innerHTML =
      '<div class="scrim" id="scrim"></div>' +
      '<div class="app">' +
        '<aside class="side" id="side">' +
          '<div class="brand"><b>Quản lý APT</b><span>Cục Lãnh sự</span></div>' +
          '<nav class="nav" aria-label="Menu chính">' + nav + '</nav>' +
          '<div class="side-foot"><b>' + esc(role.ten) + '</b>Tài khoản: ' + esc(role.user) + '<br><a href="index.html">Đăng xuất</a></div>' +
        '</aside>' +
        '<div class="main">' +
          '<header class="top">' +
            '<button type="button" class="btn secondary small menu-btn" id="menu-btn" aria-label="Mở menu">☰ Menu</button>' +
            '<h1>' + esc(title) + '</h1>' +
            '<div class="who"><label for="role-sel">Xem thử với quyền:</label><select id="role-sel">' + opts + '</select></div>' +
          '</header>' +
          '<main class="content" id="content"></main>' +
        '</div>' +
      '</div>';

    var side = document.getElementById('side'), scrim = document.getElementById('scrim');
    function toggle(open) { side.classList.toggle('open', open); scrim.classList.toggle('open', open); }
    document.getElementById('menu-btn').onclick = function () { toggle(!side.classList.contains('open')); };
    scrim.onclick = function () { toggle(false); };
    document.getElementById('role-sel').onchange = function () {
      APT.store.set('role', this.value);
      var r = APT.ROLES[this.value];
      if (APT.can(r, pageId)) g.location.reload(); else g.location.href = r.home;
    };

    var content = document.getElementById('content');
    if (!APT.can(role, pageId)) {
      content.innerHTML = '<div class="banner warn" role="alert">Tài khoản <b>' + esc(role.ten) + '</b> không có quyền vào màn hình này.</div>' +
        '<p><a class="btn" href="' + role.home + '">Về màn hình của tôi</a></p>';
      return null;
    }
    return content;
  };

  /* ---------- tab (Ngoài nước / Trong nước, v.v.) ---------- */
  APT.tabs = function (host, items, current, onPick, extraClass) {
    host.className = 'seg' + (extraClass ? ' ' + extraClass : '');
    host.setAttribute('role', 'tablist');
    function draw() {
      host.innerHTML = items.map(function (it) {
        var on = it.id === current;
        return '<button type="button" class="seg-btn' + (on ? ' on' : '') + '" role="tab" aria-selected="' + on + '" data-id="' + it.id + '">' + esc(it.ten) + '</button>';
      }).join('');
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('.seg-btn');
      if (!b) return;
      current = b.getAttribute('data-id');
      draw();
      onPick(current);
    });
    draw();
  };

  /* Ngoài nước / Trong nước, chỉ hiện những gì quyền hiện tại được xem */
  var KINDS = [{ id: 'ngoai', ten: 'Ngoài nước' }, { id: 'trong', ten: 'Trong nước' }];
  APT.kindTabs = function (host, onPick) {
    var scope = APT.role.scope;
    var items = KINDS.filter(function (k) { return scope === 'both' || scope === k.id; });
    var hash = (g.location.hash || '').replace('#', '');
    var cur = items.some(function (k) { return k.id === hash; }) ? hash : items[0].id;
    if (items.length > 1) {
      APT.tabs(host, items, cur, function (id) {
        try { g.history.replaceState(null, '', '#' + id); } catch (e) {}
        onPick(id);
      });
    } else {
      host.hidden = true;
    }
    onPick(cur);
  };

  /* ---------- dựng bảng ---------- */
  APT.headCells = function (prods) {
    return prods.map(function (p, i) {
      return '<th scope="col"><span class="no">(' + (i + 1) + ')</span>' + esc(p.nhom) + (p.ct ? '<br>' + esc(p.ct) : '') + '</th>';
    }).join('');
  };
  function numCell(v) {
    return '<td class="n' + (v === 0 ? ' zero' : '') + '">' + fmt(v) + '</td>';
  }
  APT.numCell = numCell;
  function pctCell(pct) {
    if (pct == null) return '<td class="p-none">–</td>';
    var cls = pct >= 80 ? 'p-hi' : (pct >= 40 ? 'p-mid' : 'p-lo');
    return '<td class="' + cls + '"><span class="pv">' + pct + '%</span><span class="bar"><i style="width:' + pct + '%"></i></span></td>';
  }

  /* Bảng 1 dòng số (tồn kho CLS, báo cáo trong nước...) */
  APT.rowTable = function (prods, valueOf, opts) {
    opts = opts || {};
    var cells = prods.map(function (p) { return opts.pct ? pctCell(valueOf(p)) : numCell(valueOf(p)); }).join('');
    var extra = '';
    if (opts.under) {
      extra = '<tr>' + prods.map(function (p, i) { return '<td class="under">' + (opts.under(p, i) || '') + '</td>'; }).join('') + '</tr>';
    }
    return '<div class="tbl-wrap"><table class="tbl kho"><thead><tr>' + APT.headCells(prods) + '</tr></thead><tbody><tr>' + cells + '</tr>' + extra + '</tbody></table></div>';
  };

  /* Bảng theo từng cơ quan đại diện, có dòng "Tổng".
     cellOf(i, p) → số | {pct}.  totalOf(p, idxs) → số | pct.  */
  APT.orgTable = function (prods, idxs, cellOf, totalOf, opts) {
    opts = opts || {};
    var pct = !!opts.pct;
    var head = '<th class="first stt" scope="col">STT</th><th class="first" scope="col" style="left:52px">Tên CQĐD</th>' + APT.headCells(prods);
    // hai cột đầu cùng dính bên trái
    var tong = '<tr class="tong"><td class="first stt"></td><td class="first" style="left:52px">Tổng</td>' +
      prods.map(function (p) { return pct ? pctCell(totalOf(p, idxs)) : numCell(totalOf(p, idxs)); }).join('') + '</tr>';
    var rows = idxs.map(function (i) {
      return '<tr><td class="first stt">' + (i + 1) + '</td><td class="first" style="left:52px">' + esc(APT.ORGS[i]) + '</td>' +
        prods.map(function (p) { var v = cellOf(i, p); return pct ? pctCell(v) : numCell(v); }).join('') + '</tr>';
    }).join('');
    return '<div class="tbl-wrap tall"><table class="tbl"><thead><tr>' + head + '</tr></thead><tbody>' + tong + rows + '</tbody></table></div>';
  };

  /* Ô chọn cơ quan (dùng cho "Chọn tên CQĐD") — trả về chỉ số hoặc -1 = tất cả */
  APT.orgFilter = function (host, onPick) {
    host.className = 'filter-row';
    host.innerHTML = '<label for="org-sel">Chọn tên CQĐD:</label><select class="input" id="org-sel" style="width:auto">' +
      '<option value="-1">Tất cả cơ quan</option>' +
      APT.ORGS.map(function (o, i) { return '<option value="' + i + '">' + esc(o) + '</option>'; }).join('') + '</select>';
    host.querySelector('select').onchange = function () { onPick(parseInt(this.value, 10)); };
  };
  APT.allIdx = function () { return APT.ORGS.map(function (_, i) { return i; }); };
  /* quyền chỉ thấy 1 cơ quan → trả về [chỉ số]; ngược lại null */
  APT.roleOrgIdx = function () {
    return APT.role.org ? [APT.ORGS.indexOf(APT.role.org)] : null;
  };
})(window);
