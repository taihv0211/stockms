// Báo cáo định kỳ sử dụng — cột (5) Tồn cuối kỳ tự tính từ (1)+(2)-(3)-(4) (mockup).
(function () {
  function num(el) {
    var v = parseInt(String(el.value || el.textContent).replace(/\D/g, ''), 10);
    return isNaN(v) ? 0 : v;
  }

  function recalcRow(row) {
    var opening = num(row.querySelector('[data-opening]'));
    var received = num(row.querySelector('[data-received]'));
    var used = num(row.querySelector('[data-used]'));
    var damaged = num(row.querySelector('[data-damaged]'));
    var closing = opening + received - used - damaged;
    row.querySelector('[data-closing]').textContent = closing.toLocaleString('vi-VN');
  }

  document.querySelectorAll('#usage-report-table [data-row]').forEach(function (row) {
    row.querySelectorAll('[data-received], [data-used], [data-damaged]').forEach(function (input) {
      input.addEventListener('input', function () { recalcRow(row); });
    });
    recalcRow(row);
  });
})();
