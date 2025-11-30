// assets/js/export_excel.js
export function exportToXLS({ bulan, tahun, pemasukan = [], pengeluaran = [] }) {
    // build HTML table similar to PHP export_excel.php
    const title = `LAPORAN KEUANGAN - ${bulan}/${tahun}`;
    let html = '<html><head><meta charset="utf-8" /></head><body>';
    html += `<h3>${title}</h3>`;

    html += '<h3>Pemasukan</h3>';
    html += '<table border="1"><tr><th>No</th><th>Tanggal</th><th>Jumlah</th><th>Keterangan</th></tr>';
    let no = 1;
    for (const p of pemasukan) {
        const tanggal = p.tanggal_bayar ? p.tanggal_bayar : "";
        const jumlah = p.total_pembayaran || 0;
        const ket = (p.keterangan || "") + (p.pesanan?.nama_pelanggan ? (" - " + p.pesanan.nama_pelanggan) : "");
        html += `<tr><td>${no++}</td><td>${tanggal}</td><td>${jumlah}</td><td>${ket}</td></tr>`;
    }
    html += '</table>';

    html += '<br><h3>Pengeluaran</h3>';
    html += '<table border="1"><tr><th>No</th><th>Tanggal</th><th>Jumlah</th><th>Keterangan</th></tr>';
    no = 1;
    for (const x of pengeluaran) {
        html += `<tr><td>${no++}</td><td>${x.tanggal}</td><td>${x.jumlah}</td><td>${x.keterangan || ""}</td></tr>`;
    }
    html += '</table>';

    const totalMasuk = pemasukan.reduce((s, r) => s + Number(r.total_pembayaran || 0), 0);
    const totalKeluar = pengeluaran.reduce((s, r) => s + Number(r.jumlah || 0), 0);
    const keuntungan = totalMasuk - totalKeluar;

    html += `<br><h3>Ringkasan</h3>`;
    html += '<table border="1"><tr><th>Total Pemasukan</th><th>Total Pengeluaran</th><th>Keuntungan</th></tr>';
    html += `<tr><td>${totalMasuk}</td><td>${totalKeluar}</td><td>${keuntungan}</td></tr>`;
    html += '</table>';

    html += '</body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Keuangan_${bulan}_${tahun}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
