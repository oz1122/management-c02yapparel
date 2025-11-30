// assets/js/grafik_keuangan.js

let chartInstance = null;

function tryRenderChart() {
    const canvas = document.getElementById("grafikKeuangan");
    if (!canvas) return;

    let dataMasuk = [];
    let dataKeluar = [];
    let labelBulan = [];

    try {
        dataMasuk = JSON.parse(canvas.dataset.masuk || "[]");
        dataKeluar = JSON.parse(canvas.dataset.keluar || "[]");
        labelBulan = JSON.parse(canvas.dataset.bulan || "[]");
    } catch (e) {
        return; // dataset belum siap
    }

    // Cegah render saat data kosong
    if (dataMasuk.length === 0 || dataKeluar.length === 0) {
        return;
    }

    // Hapus grafik sebelumnya
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labelBulan,
            datasets: [
                {
                    label: "Pemasukan",
                    data: dataMasuk,
                    borderColor: "#2ecc71",
                    backgroundColor: "rgba(46, 204, 113, .2)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: "Pengeluaran",
                    data: dataKeluar,
                    borderColor: "#e74c3c",
                    backgroundColor: "rgba(231, 76, 60, .2)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const val = context.raw || 0;
                            return `${context.dataset.label}: Rp ${val.toLocaleString()}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => "Rp " + v.toLocaleString(),
                    },
                },
            },
        },
    });

    // grafik sudah terbuat → stop pengecekan
    clearInterval(window._chartChecker);
}

// Cek setiap 500ms apakah dataset sudah diisi keuangan.js
window._chartChecker = setInterval(tryRenderChart, 500);
