/* ============================================================
   PHIẾU XUẤT / NHẬP / ĐIỀU CHUYỂN
   - Loại có seri: nhập theo dải Từ – Đến (nhiều dải), SỐ LƯỢNG TỰ TÍNH.
   - Loại không seri: nhập thẳng số lượng.
   - Xuất kho có luồng duyệt: Xác nhận → Lãnh đạo VP → Lãnh đạo Cục.
   - Phiếu được nhớ trên trình duyệt để đổi quyền xem thử vẫn thấy phiếu đang chờ.
   ============================================================ */
(function (g) {
  'use strict';
  var APT = g.APT, esc = APT.esc, fmt = APT.fmt;

  /* ---------- seri ---------- */
  function parseSeri(s) {
    var m = /^\s*([A-Za-z]{0,3})\s*([0-9][0-9.\s]*)\s*$/.exec(s || '');
    if (!m) return null;
    var d = m[2].replace(/[^0-9]/g, '');
    return { p: m[1].toUpperCase(), n: parseInt(d, 10) };
  }
  function rangeInfo(r) {
    if (!r.f && !r.t) return { empty: true, n: 0 };
    var a = parseSeri(r.f), b = parseSeri(r.t);
    if (!a || !b) return { err: 'Nhập đủ số Từ và Đến', n: 0 };
    if (a.p !== b.p) return { err: 'Hai số phải cùng ký hiệu', n: 0 };
    if (b.n < a.n) return { err: 'Số Đến nhỏ hơn số Từ', n: 0 };
    return { n: b.n - a.n + 1, p: a.p, a: a.n, b: b.n };
  }
  /* trả về { total, infos[] } — infos[i].err nếu dải lỗi hoặc trùng dải khác */
  function productInfo(list) {
    var infos = list.map(rangeInfo), total = 0;
    infos.forEach(function (x, i) {
      if (x.err || x.empty) return;
      for (var j = 0; j < i; j++) {
        var y = infos[j];
        if (!y.err && !y.empty && y.p === x.p && x.a <= y.b && y.a <= x.b) { x.err = 'Trùng với dải bên trên'; x.n = 0; return; }
      }
    });
    infos.forEach(function (x) { total += x.n || 0; });
    return { total: total, infos: infos };
  }
  function digits(s) { return String(s || '').replace(/[^0-9]/g, ''); }

  var STATUS = {
    nhap:     { t: 'Chưa xác nhận',           c: 'idle' },
    'cho-vp': { t: 'Chờ Lãnh đạo VP duyệt',   c: 'wait' },
    'cho-cuc':{ t: 'Chờ Lãnh đạo Cục duyệt',  c: 'wait' },
    'hoan-tat': { t: 'Đã duyệt xong',         c: 'ok' },
    'tra-lai':{ t: 'Cần điều chỉnh',          c: 'bad' },
    xong:     { t: 'Đã xác nhận',             c: 'ok' }
  };

  /* cfg: { mount, key, kind, xuat:{fixed|options}, nhan:{fixed|options}, qtyLabel,
            approvals, doneText, sample } */
  APT.phieu = function (cfg) {
    var root = cfg.mount, role = APT.role;
    var prods = APT.products(cfg.kind);
    var storeKey = 'phieu.' + cfg.key;

    function fresh() {
      var m = { xuat: cfg.xuat.fixed || (cfg.xuat.def || ''), nhan: cfg.nhan.fixed || '', ngay: APT.todayISO(), nguoi: '',
        qty: {}, rg: {}, status: 'nhap', steps: {}, at: {} };
      if (cfg.sample) {
        var seriList = prods.filter(function (p) { return p.seri; });
        if (seriList[0]) m.rg[seriList[0].id] = [{ f: 'G 10002569', t: 'G 10002589' }];
        if (seriList[1]) m.rg[seriList[1].id] = [{ f: 'C 3000100', t: 'C 3000119' }, { f: 'C 3000150', t: 'C 3000154' }];
        var plain = prods.filter(function (p) { return !p.seri; });
        plain.slice(-2).forEach(function (p, i) { m.qty[p.id] = String(i ? 2 : 1230); });
      }
      return m;
    }
    var m = APT.store.get(storeKey, null) || fresh();

    function save() { APT.store.set(storeKey, m); }
    function editable() { return !!role.act.lap && (m.status === 'nhap' || m.status === 'tra-lai'); }
    function rgOf(pid) {
      if (!m.rg[pid] || !m.rg[pid].length) m.rg[pid] = [{ f: '', t: '' }];
      return m.rg[pid];
    }

    /* ---------- HTML ---------- */
    function fieldHtml(id, label, spec, val, ro) {
      var h = '<div class="field"><label for="' + id + '">' + label + '</label>';
      if (spec.fixed) {
        h += '<input class="input" id="' + id + '" value="' + esc(spec.fixed) + '" readonly>';
      } else {
        h += '<select class="input" id="' + id + '" data-f="' + id.replace('pf-', '') + '"' + (ro ? ' disabled' : '') + '><option value="">— Chọn —</option>' +
          spec.options.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
      }
      return h + '</div>';
    }
    function seriCell(p, ro) {
      var list = rgOf(p.id);
      var h = list.map(function (r, i) {
        return '<div class="rg" data-pid="' + p.id + '" data-i="' + i + '">' +
          '<label>Từ</label><input class="input rg-f" value="' + esc(r.f) + '" placeholder="G 10002569" autocomplete="off"' + (ro ? ' disabled' : '') + '>' +
          '<label>Đến</label><input class="input rg-t" value="' + esc(r.t) + '" placeholder="G 10002589" autocomplete="off"' + (ro ? ' disabled' : '') + '>' +
          '<div class="rg-foot"><span>Được <b class="rg-n">0</b> số</span>' +
            (list.length > 1 && !ro ? '<button type="button" class="rg-x" data-act="del" aria-label="Xóa dải số này">Xóa</button>' : '') + '</div>' +
          '<div class="rg-err" role="alert"></div></div>';
      }).join('');
      if (!ro) h += '<button type="button" class="btn secondary small rg-add" data-act="add" data-pid="' + p.id + '">+ Thêm dải số</button>';
      return h;
    }
    function tableHtml(ro) {
      var head = '<th class="first" scope="col"></th>' + APT.headCells(prods);
      var qrow = '<tr><td class="first">Số lượng</td>' + prods.map(function (p) {
        if (p.seri) return '<td><output class="qty-auto zero" data-pid="' + p.id + '">0<small>tự tính từ seri</small></output></td>';
        return '<td><input class="input qty-in" inputmode="numeric" data-pid="' + p.id + '" value="' + (m.qty[p.id] ? fmt(m.qty[p.id]) : '') + '" placeholder="0" aria-label="Số lượng ' + esc(p.ten) + '"' + (ro ? ' disabled' : '') + '></td>';
      }).join('') + '</tr>';
      var srow = '<tr><td class="first">Số seri</td>' + prods.map(function (p) {
        return p.seri ? '<td>' + seriCell(p, ro) + '</td>' : '<td class="no-seri">Không có seri</td>';
      }).join('') + '</tr>';
      return '<div class="tbl-wrap"><table class="tbl tbl-form"><thead><tr>' + head + '</tr></thead><tbody>' + qrow + srow + '</tbody></table></div>';
    }

    function who() { return role.ten; }
    function stepHtml() {
      var st = STATUS[m.status];
      var h = '<section class="steps" aria-label="Duyệt phiếu"><h2>Duyệt phiếu</h2>' +
        '<div class="status-line">Tình trạng: <span class="pill ' + st.c + '">' + st.t + '</span></div>';

      // Bước 1
      h += '<div class="step"><div class="step-t">1. Xác nhận</div><div class="step-b">';
      if (m.status === 'nhap' || m.status === 'tra-lai') {
        h += editable() ? '<div class="row"><button type="button" class="btn" data-act="confirm">Xác nhận</button></div>'
                        : '<span class="st-idle">Chưa xác nhận</span>';
      } else {
        h += '<span class="st-ok">✔ Đã xác nhận — ' + esc(m.at.xacnhan || '') + '</span>';
      }
      h += '</div></div>';

      h += approveRow('vp', '2. Lãnh đạo VP duyệt', 'cho-vp', 'duyetVP');
      h += approveRow('cuc', '3. Lãnh đạo Cục duyệt', 'cho-cuc', 'duyetCuc');
      return h + '</section>';
    }
    function approveRow(code, label, turnStatus, perm) {
      var s = m.steps[code], turn = m.status === turnStatus, can = !!role.act[perm];
      var h = '<div class="step"><div class="step-t">' + label + '</div><div class="step-b">';
      if (turn && can) {
        h += '<div class="field"><label for="ykien-' + code + '">Ý kiến điều chỉnh</label>' +
          '<textarea class="input" id="ykien-' + code + '" placeholder="Chỉ cần ghi khi yêu cầu điều chỉnh"></textarea></div>' +
          '<div class="row"><button type="button" class="btn good" data-act="ok" data-step="' + code + '">Duyệt</button>' +
          '<button type="button" class="btn warn" data-act="tra" data-step="' + code + '">Yêu cầu điều chỉnh</button></div>' +
          '<div class="rg-err" id="err-' + code + '" role="alert"></div>';
      } else if (s && s.res === 'duyet') {
        h += '<span class="st-ok">✔ Đã duyệt — ' + esc(s.by) + ', ' + esc(s.at) + '</span>';
        if (s.note) h += '<span>Ý kiến: ' + esc(s.note) + '</span>';
      } else if (s && s.res === 'tra') {
        h += '<span class="st-bad">✖ Yêu cầu điều chỉnh — ' + esc(s.by) + ', ' + esc(s.at) + '</span><span>Ý kiến: ' + esc(s.note) + '</span>';
      } else if (turn) {
        h += '<span class="st-wait">Đang chờ duyệt</span>';
      } else {
        h += '<span class="st-idle">Chưa đến bước này</span>';
      }
      return h + '</div></div>';
    }
    function simpleActionHtml() {
      if (m.status === 'xong') {
        return '<div class="banner ok" role="status">✔ ' + esc(cfg.doneText) + ' Lúc ' + esc(m.at.xacnhan) + ' — ' + esc(m.by || '') + '.</div>' +
          (role.act.lap ? '<div class="pf-actions"><button type="button" class="btn secondary" data-act="new">Lập phiếu mới</button></div>' : '');
      }
      return editable() ? '<div class="pf-actions"><button type="button" class="btn" data-act="confirm">Xác nhận</button></div>' : '';
    }

    function render() {
      var wrap = root.querySelector('.tbl-wrap'), sl = wrap ? wrap.scrollLeft : 0;
      var ro = !editable();
      var html =
        '<div class="pf-grid">' +
          fieldHtml('pf-xuat', 'Cơ quan xuất', cfg.xuat, m.xuat, ro) +
          '<div class="field"><label for="pf-ngay">Ngày giao</label><input class="input" type="date" id="pf-ngay" data-f="ngay" value="' + esc(m.ngay) + '"' + (ro ? ' disabled' : '') + '></div>' +
          fieldHtml('pf-nhan', 'Cơ quan nhận', cfg.nhan, m.nhan, ro) +
          '<div class="field"><label for="pf-nguoi">Người nhận</label><input class="input" id="pf-nguoi" data-f="nguoi" value="' + esc(m.nguoi) + '" autocomplete="off"' + (ro ? ' disabled' : '') + '></div>' +
        '</div>' +
        '<div class="pf-head"><h2>' + esc(cfg.qtyLabel) + '</h2><div class="pf-total">Tổng số lượng: <b id="pf-total">0</b></div></div>' +
        tableHtml(ro) +
        '<div class="pf-msg" id="pf-msg"></div>' +
        (cfg.approvals ? stepHtml() : simpleActionHtml());
      if (cfg.approvals && m.status === 'hoan-tat' && role.act.lap) {
        html += '<div class="pf-actions"><button type="button" class="btn secondary" data-act="new">Lập phiếu mới</button></div>';
      }
      if (!cfg.approvals && m.status !== 'xong' && !role.act.lap) {
        html += '<div class="banner info" style="margin-top:16px">Tài khoản này chỉ được xem phiếu.</div>';
      }
      root.innerHTML = html;
      var w2 = root.querySelector('.tbl-wrap'); if (w2) w2.scrollLeft = sl;
      derive();
    }

    /* cập nhật số lượng tự tính, báo lỗi dải seri, tổng số lượng — không dựng lại form */
    function derive() {
      var total = 0;
      prods.forEach(function (p) {
        if (p.seri) {
          var pi = productInfo(rgOf(p.id));
          total += pi.total;
          var out = root.querySelector('.qty-auto[data-pid="' + p.id + '"]');
          if (out) {
            out.classList.toggle('zero', pi.total === 0);
            out.innerHTML = fmt(pi.total) + '<small>tự tính từ seri</small>';
          }
          root.querySelectorAll('.rg[data-pid="' + p.id + '"]').forEach(function (box, i) {
            var x = pi.infos[i] || {};
            box.classList.toggle('bad', !!x.err);
            box.querySelector('.rg-n').textContent = fmt(x.n || 0);
            box.querySelector('.rg-err').textContent = x.err || '';
          });
        } else {
          total += parseInt(m.qty[p.id] || '0', 10) || 0;
        }
      });
      var t = root.querySelector('#pf-total'); if (t) t.textContent = fmt(total);
      return total;
    }

    function problems() {
      var e = [];
      if (!m.xuat) e.push('Chưa chọn cơ quan xuất.');
      if (!m.nhan) e.push('Chưa chọn cơ quan nhận.');
      if (m.xuat && m.xuat === m.nhan) e.push('Cơ quan xuất và cơ quan nhận không được trùng nhau.');
      if (!m.ngay) e.push('Chưa chọn ngày giao.');
      if (!m.nguoi.trim()) e.push('Chưa nhập người nhận.');
      var bad = false;
      prods.forEach(function (p) {
        if (p.seri && productInfo(rgOf(p.id)).infos.some(function (x) { return x.err; })) bad = true;
      });
      if (bad) e.push('Có dải số seri bị lỗi (được tô đỏ). Vui lòng sửa lại.');
      if (derive() === 0) e.push('Chưa nhập số lượng ấn phẩm nào.');
      return e;
    }
    function showMsg(cls, html) {
      var box = root.querySelector('#pf-msg');
      if (box) box.innerHTML = html ? '<div class="banner ' + cls + '" role="alert">' + html + '</div>' : '';
    }

    /* ---------- sự kiện (gắn 1 lần, dùng ủy quyền) ---------- */
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.classList.contains('qty-in')) {
        var d = digits(t.value); m.qty[t.getAttribute('data-pid')] = d; t.value = d ? fmt(d) : '';
      } else if (t.classList.contains('rg-f') || t.classList.contains('rg-t')) {
        var box = t.closest('.rg'), r = rgOf(box.getAttribute('data-pid'))[+box.getAttribute('data-i')];
        r[t.classList.contains('rg-f') ? 'f' : 't'] = t.value;
      } else if (t.getAttribute('data-f')) {
        m[t.getAttribute('data-f')] = t.value;
      } else return;
      save(); derive();
    });
    root.addEventListener('change', function (e) {
      var f = e.target.getAttribute && e.target.getAttribute('data-f');
      if (f && e.target.tagName === 'SELECT') { m[f] = e.target.value; save(); }
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'add') { rgOf(b.getAttribute('data-pid')).push({ f: '', t: '' }); save(); render(); }
      else if (act === 'del') {
        var box = b.closest('.rg'); rgOf(box.getAttribute('data-pid')).splice(+box.getAttribute('data-i'), 1); save(); render();
      }
      else if (act === 'confirm') {
        var errs = problems();
        if (errs.length) { showMsg('bad', 'Chưa thể xác nhận:<ul>' + errs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'); return; }
        m.at.xacnhan = APT.now(); m.by = who(); m.steps = {};
        m.status = cfg.approvals ? 'cho-vp' : 'xong';
        save(); render();
      }
      else if (act === 'ok' || act === 'tra') {
        var code = b.getAttribute('data-step'), note = (root.querySelector('#ykien-' + code).value || '').trim();
        if (act === 'tra' && !note) { root.querySelector('#err-' + code).textContent = 'Vui lòng ghi ý kiến điều chỉnh trước khi trả lại.'; return; }
        m.steps[code] = { res: act === 'ok' ? 'duyet' : 'tra', by: who(), at: APT.now(), note: note };
        m.status = act === 'tra' ? 'tra-lai' : (code === 'vp' ? 'cho-cuc' : 'hoan-tat');
        save(); render();
      }
      else if (act === 'new') {
        if (g.confirm('Xóa phiếu hiện tại và lập phiếu mới?')) { m = fresh(); save(); render(); }
      }
    });

    render();
  };
})(window);
