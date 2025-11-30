// assets/js/dashboard.js
import { supabase } from "./supabase.js";

/* =======================================================
   FUNGSI SUM PER BULAN (SAMA PERSIS DENGAN KEUANGAN)
======================================================= */
async function sumPembayaranForMonthYear(month, year) {
    const start = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;

    const { data } = await supabase
        .from("pembayaran")
        .select("total_pembayaran")
        .gte("tanggal_bayar", start)
        .lte("tanggal_bayar", end);

    return (data || []).reduce((s, r) => s + Number(r.total_pembayaran || 0), 0);
}

async function sumPengeluaranForMonthYear(month, year) {
    const start = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;

    const { data } = await supabase
        .from("pengeluaran")
        .select("jumlah")
        .gte("tanggal", start)
        .lte("tanggal", end);

    return (data || []).reduce((s, r) => s + Number(r.jumlah || 0), 0);
}

/* =======================================================
   LOAD DATA DASHBOARD UTAMA
======================================================= */
async function loadDashboard() {
    // total pesanan
    const { data: pesanan } = await supabase
        .from("pesanan")
        .select("id");

    document.getElementById("jumlahPesanan").textContent =
        pesanan?.length ?? 0;

    // pelanggan unik
    const { data: listNama } = await supabase
        .from("pesanan")
        .select("nama_pelanggan");

    const unik = new Set(listNama.map(d => d.nama_pelanggan));
    document.getElementById("jumlahPelanggan").textContent = unik.size;

    // total pengeluaran
    const { data: pengeluaran } = await supabase
        .from("pengeluaran")
        .select("jumlah");

    const totalKeluar = pengeluaran.reduce((a, b) => a + Number(b.jumlah || 0), 0);
    document.getElementById("totalKeluar").textContent =
        "Rp" + totalKeluar.toLocaleString();

    // total pemasukan
    const { data: pembayaran } = await supabase
        .from("pembayaran")
        .select("total_pembayaran");

    const totalMasuk = pembayaran.reduce((a, b) => a + Number(b.total_pembayaran || 0), 0);
    document.getElementById("totalMasuk").textContent =
        "Rp" + totalMasuk.toLocaleString();

    // GRAFIK — AMBIL DATA PER BULAN
    const year = new Date().getFullYear();
    const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const dataMasuk = [];
    const dataKeluar = [];

    for (let m = 1; m <= 12; m++) {
        dataMasuk.push(await sumPembayaranForMonthYear(m, year));
        dataKeluar.push(await sumPengeluaranForMonthYear(m, year));
    }

    drawDashboardChart(labels, dataMasuk, dataKeluar);
}

/* =======================================================
   DRAW CHART (SAMA STYLE DENGAN KEUANGAN)
======================================================= */
function drawDashboardChart(labels, masuk, keluar) {
    const ctx = document.getElementById("grafikDashboard").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Pemasukan",
                    data: masuk,
                    borderColor: "rgba(46, 204, 113, 1)",
                    backgroundColor: "rgba(46, 204, 113, .3)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: "Pengeluaran",
                    data: keluar,
                    borderColor: "rgba(231, 76, 60, 1)",
                    backgroundColor: "rgba(231, 76, 60, .3)",
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: (v) => "Rp " + v.toLocaleString()
                    }
                }
            }
        }
    });
}

loadDashboard();
