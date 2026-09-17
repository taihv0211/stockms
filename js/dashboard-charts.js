// Khởi tạo 2 biểu đồ Dashboard bằng Chart.js.
// Đổi dữ liệu mẫu trong DASH_DATA khi nối API thật.
(function () {
  if (typeof Chart === 'undefined') return;

  var css = getComputedStyle(document.documentElement);
  var color = function (name) { return css.getPropertyValue(name).trim(); };

  Chart.defaults.font.family = "IBM Plex Sans, system-ui, sans-serif";
  Chart.defaults.font.size = 11.5;
  Chart.defaults.color = color('--text-muted');

  var DASH_DATA = {
    months: ['04/2026', '05/2026', '06/2026', '07/2026', '08/2026', '09/2026'],
    nhap: [820, 640, 910, 1050, 700, 980],
    xuat: [650, 700, 800, 900, 860, 1120],
    warehouseSplit: { domestic: 4820, foreign: 1240 }
  };

  // ---- Chart 1: Nhập / Xuất theo tháng ----
  var barEl = document.getElementById('chart-in-out');
  if (barEl) {
    new Chart(barEl, {
      type: 'bar',
      data: {
        labels: DASH_DATA.months,
        datasets: [
          { label: 'Nhập kho', data: DASH_DATA.nhap, backgroundColor: color('--accent-500') || color('--accent'), borderRadius: 4, maxBarThickness: 22 },
          { label: 'Xuất kho', data: DASH_DATA.xuat, backgroundColor: color('--chart-2'), borderRadius: 4, maxBarThickness: 22 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: color('--surface'), titleColor: color('--text'), bodyColor: color('--text-muted'),
            borderColor: color('--border'), borderWidth: 1, padding: 10, boxPadding: 4,
            titleFont: { weight: '700' }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { color: color('--border') } },
          y: {
            beginAtZero: true,
            grid: { color: color('--border') },
            border: { display: false },
            ticks: { callback: function (v) { return v.toLocaleString('vi-VN'); } }
          }
        }
      }
    });
  }

  // ---- Chart 2: Tỷ trọng tồn kho Trong nước / Ngoài nước ----
  var donutEl = document.getElementById('chart-warehouse-split');
  if (donutEl) {
    var d = DASH_DATA.warehouseSplit;
    var total = d.domestic + d.foreign;
    new Chart(donutEl, {
      type: 'doughnut',
      data: {
        labels: ['Trong nước', 'Ngoài nước'],
        datasets: [{
          data: [d.domestic, d.foreign],
          backgroundColor: [color('--accent-500') || color('--accent'), color('--chart-2')],
          borderColor: color('--surface'),
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: color('--surface'), titleColor: color('--text'), bodyColor: color('--text-muted'),
            borderColor: color('--border'), borderWidth: 1, padding: 10,
            callbacks: {
              label: function (ctx) {
                var pct = Math.round((ctx.parsed / total) * 100);
                return ctx.label + ': ' + ctx.parsed.toLocaleString('vi-VN') + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
    var totalEl = document.querySelector('#donut-total');
    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN');
  }
})();
