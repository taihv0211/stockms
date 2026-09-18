// Xuất kho / Cấp phát — tab switch + tự tính số lượng từ series (mockup).
(function () {
  function parseSerial(v) {
    var m = String(v || '').match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : NaN;
  }

  function recalc(scope) {
    var rowsWrap = document.querySelector('[data-series-rows="' + scope + '"]');
    var totalEl = document.querySelector('[data-qty-total="' + scope + '"]');
    var outEl = document.querySelector('[data-qty-out="' + scope + '"]');
    if (!rowsWrap) return;
    var total = 0;
    rowsWrap.querySelectorAll('.series-range-row').forEach(function (row) {
      var boxes = row.querySelectorAll('.series-box');
      var a = parseSerial(boxes[0].value);
      var b = parseSerial(boxes[1].value);
      if (!isNaN(a) && !isNaN(b) && b >= a) total += (b - a + 1);
    });
    var totalStr = total.toLocaleString('vi-VN');
    if (totalEl) totalEl.textContent = totalStr;
    if (outEl) outEl.value = totalStr;
  }

  function wireRow(row, scope) {
    row.querySelectorAll('.series-box').forEach(function (box) {
      box.addEventListener('input', function () { recalc(scope); });
    });
    var removeBtn = row.querySelector('[data-remove-row]');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        row.remove();
        recalc(scope);
      });
    }
  }

  // Khởi tạo mọi khối series-rows có trên trang (issue / transfer / external).
  document.querySelectorAll('[data-series-rows]').forEach(function (wrap) {
    var scope = wrap.getAttribute('data-series-rows');
    wrap.querySelectorAll('.series-range-row').forEach(function (row) { wireRow(row, scope); });
    recalc(scope);
  });

  document.querySelectorAll('[data-add-row]').forEach(function (link) {
    link.addEventListener('click', function () {
      var scope = link.getAttribute('data-add-row');
      var wrap = document.querySelector('[data-series-rows="' + scope + '"]');
      if (!wrap) return;
      var row = document.createElement('div');
      row.className = 'series-range-row';
      row.innerHTML =
        '<input class="series-box" value=""><span class="series-dash">–</span><input class="series-box" value="">' +
        '<button class="btn danger sm icon-only" aria-label="Xoá đoạn" data-remove-row>' +
        '<svg class="icon icon-sm"><use href="#i-trash"/></svg></button>';
      wrap.appendChild(row);
      wireRow(row, scope);
      recalc(scope);
    });
  });

  // Tab switch (segmented control) — không phải nav, chỉ show/hide panel trong cùng trang.
  var tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    tabs.querySelectorAll('.seg').forEach(function (seg) {
      seg.addEventListener('click', function () {
        var target = seg.getAttribute('data-tab');
        tabs.querySelectorAll('.seg').forEach(function (s) { s.classList.remove('is-sel'); });
        seg.classList.add('is-sel');
        document.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-tab-panel') !== target;
        });
      });
    });
  }
})();
