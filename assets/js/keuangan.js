// assets/js/keuangan.js
import { supabase } from "./supabase.js";
import { tambahPengeluaran, editPengeluaran, hapusPengeluaran } from "./aksi_pengeluaran.js";
import { exportToXLS } from "./export_excel.js";

const bulanSelect = document.getElementById("bulanSelect");
const tahunSelect = document.getElementById("tahunSelect");
const applyFilter = document.getElementById("applyFilter");
const toggleFilter = document.getElementById("toggleFilter");
const filterDropdown = document.getElementById("filterDropdown");
const keywordInput = document.getElementById("keyword");
const exportBtn = document.getElementById("exportBtn");
const btnTambahPengeluaran = document.getElementById("btnTambahPengeluaran");

const bodyPemasukan = document.getElementById("bodyPemasukan");
const bodyPengeluaran = document.getElementById("bodyPengeluaran");
const totalMasukEl = document.getElementById("totalMasuk");
const totalKeluarEl = document.getElementById("totalKeluar");
const totalKeuntunganEl = document.getElementById("totalKeuntungan");

const nBulan = document.getElementById("nBulan");
const nTahun = document.getElementById("nTahun");
const nBulan2 = document.getElementById("nBulan2");
const nTahun2 = document.getElementById("nTahun2");

const grafikCanvas = document.getElementById("grafikKeuangan");

const monthNamesIndo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const namaBulanList = {
    "01":"Januari","02":"Februari","03":"Maret","04":"April",
    "05":"Mei","06":"Juni","07":"Juli","08":"Agustus",
    "09":"September","10":"Oktober","11":"November","12":"Desember"
};

function initMonthYearSelectors() {
    for (let i=1;i<=12;i++){
        const val = String(i).padStart(2,'0');
        const option = document.createElement("option");
        option.value = val;
        option.textContent = new Date(2000,i-1,1).toLocaleString('id-ID',{month:'long'});
        bulanSelect.appendChild(option);
    }
    const thisYear = new Date().getFullYear();
    for (let y=thisYear-5; y<=thisYear+1; y++){
        const option = document.createElement("option");
        option.value = String(y);
        option.textContent = y;
        tahunSelect.appendChild(option);
    }
    bulanSelect.value = String(new Date().getMonth()+1).padStart(2,'0');
    tahunSelect.value = String(new Date().getFullYear());
}

toggleFilter.addEventListener('click', () => {
    filterDropdown.classList.toggle('hidden');
});

applyFilter.addEventListener('click', () => {
    loadAll();
    filterDropdown.classList.add('hidden');
});

document.getElementById("btnSearch").addEventListener("click", () => {
    loadAll();
});

exportBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const bulan = bulanSelect.value;
    const tahun = tahunSelect.value;
    const pemasukan = await fetchPemasukan(bulan, tahun, keywordInput.value);
    const pengeluaran = await fetchPengeluaran(bulan, tahun, keywordInput.value);
    exportToXLS({ bulan, tahun, pemasukan, pengeluaran });
});

btnTambahPengeluaran.addEventListener("click", async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Tambah Pengeluaran',
        html:
            '<input id="sw_jumlah" class="swal2-input" placeholder="Jumlah">' +
            '<input id="sw_tanggal" type="date" class="swal2-input">' +
            '<input id="sw_ket" class="swal2-input" placeholder="Keterangan">',
        preConfirm: () => ({
            jumlah: document.getElementById('sw_jumlah').value,
            tanggal: document.getElementById('sw_tanggal').value,
            keterangan: document.getElementById('sw_ket').value
        })
    });

    if (!formValues) return;
    const { jumlah, tanggal, keterangan } = formValues;
    if (!jumlah || !tanggal || !keterangan) {
        return Swal.fire("Error", "Semua field wajib diisi.", "error");
    }

    const res = await tambahPengeluaran(jumlah, tanggal, keterangan);
    if (res.status === "success") {
        Swal.fire("Berhasil", "Pengeluaran ditambahkan.", "success");
        loadAll();
    } else {
        Swal.fire("Gagal", res.msg || "Error", "error");
    }
});

async function fetchPemasukan(bulan, tahun, keyword) {
    let query = supabase
        .from("pembayaran")
        .select("id, pesanan_id, total_pembayaran, tanggal_bayar, keterangan, pesanan (nama_pelanggan, nama_produk)");

    const { data, error } = await query.order('tanggal_bayar', { ascending: false });
    if (error) return [];

    const month = parseInt(bulan, 10);
    const year = parseInt(tahun, 10);

    return (data || []).filter(row => {
        const d = new Date(row.tanggal_bayar);
        if (d.getMonth()+1 !== month || d.getFullYear() !== year) return false;
        if (keyword) {
            const k = keyword.toLowerCase();
            return (
                (row.pesanan?.nama_pelanggan || "").toLowerCase().includes(k) ||
                (row.pesanan?.nama_produk || "").toLowerCase().includes(k) ||
                String(row.total_pembayaran).includes(k)
            );
        }
        return true;
    });
}

async function fetchPengeluaran(bulan, tahun, keyword) {
    const { data, error } = await supabase
        .from("pengeluaran")
        .select("*")
        .order("tanggal", { ascending: false });

    if (error) return [];

    const month = parseInt(bulan, 10);
    const year = parseInt(tahun, 10);

    return (data || []).filter(row => {
        const d = new Date(row.tanggal);
        if (d.getMonth()+1 !== month || d.getFullYear() !== year) return false;
        if (keyword) {
            const k = keyword.toLowerCase();
            return (row.keterangan || "").toLowerCase().includes(k) || String(row.jumlah).includes(k);
        }
        return true;
    });
}

async function loadAll() {
    const bulan = bulanSelect.value;
    const tahun = tahunSelect.value;
    const keyword = keywordInput.value || "";

    const namaBulan = namaBulanList[bulan];
    nBulan.textContent = namaBulan;
    nTahun.textContent = tahun;
    nBulan2.textContent = namaBulan;
    nTahun2.textContent = tahun;

    const pemasukan = await fetchPemasukan(bulan, tahun, keyword);
    const pengeluaran = await fetchPengeluaran(bulan, tahun, keyword);

    const totalMasuk = pemasukan.reduce((s, r) => s + Number(r.total_pembayaran), 0);
    const totalKeluar = pengeluaran.reduce((s, r) => s + Number(r.jumlah), 0);
    const keuntungan = totalMasuk - totalKeluar;

    totalMasukEl.textContent = `Rp ${numberWithCommas(totalMasuk)}`;
    totalKeluarEl.textContent = `Rp ${numberWithCommas(totalKeluar)}`;
    totalKeuntunganEl.textContent = `Rp ${numberWithCommas(keuntungan)}`;

    renderPemasukanTable(pemasukan);
    renderPengeluaranTable(pengeluaran);

    await setChartDataset(parseInt(tahun));
}

/* =======================================================
   FIX PERHITUNGAN GRAFIK (VERSI BENAR)
======================================================= */
async function setChartDataset(year) {
    const dataMasuk = [];
    const dataKeluar = [];

    for (let m=1; m<=12; m++) {
        const masuk = await sumPembayaranForMonthYear(m, year);
        const keluar = await sumPengeluaranForMonthYear(m, year);
        dataMasuk.push(masuk);
        dataKeluar.push(keluar);
    }

    grafikCanvas.dataset.masuk = JSON.stringify(dataMasuk);
    grafikCanvas.dataset.keluar = JSON.stringify(dataKeluar);
    grafikCanvas.dataset.bulan  = JSON.stringify(monthNamesIndo);
}

/* =======================================================
   FUNGSI SUM PER BULAN (VERSI FIX)
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
   RENDER TABEL
======================================================= */

function renderPemasukanTable(rows) {
    bodyPemasukan.innerHTML = "";
    if (!rows.length) {
        bodyPemasukan.innerHTML = `<tr><td colspan="4" class="nodata">Tidak ada pemasukan</td></tr>`;
        return;
    }

    let no = 1;
    rows.forEach(r => {
        const tgl = new Date(r.tanggal_bayar).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
        const nama = r.pesanan?.nama_pelanggan || "Tanpa Nama";
        const produk = r.pesanan?.nama_produk || "Produk Tidak Diketahui";

        bodyPemasukan.innerHTML += `
            <tr>
                <td>${no++}</td>
                <td>${tgl}</td>
                <td>Rp ${numberWithCommas(r.total_pembayaran)}</td>
                <td>${nama} - ${produk} (bayar)</td>
            </tr>
        `;
    });
}

function renderPengeluaranTable(rows) {
    bodyPengeluaran.innerHTML = "";
    if (!rows.length) {
        bodyPengeluaran.innerHTML = `<tr><td colspan="5" class="nodata">Tidak ada pengeluaran</td></tr>`;
        return;
    }

    let no = 1;
    rows.forEach(r => {
        const tgl = new Date(r.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});

        bodyPengeluaran.innerHTML += `
            <tr>
                <td>${no++}</td>
                <td>${tgl}</td>
                <td>Rp ${numberWithCommas(r.jumlah)}</td>
                <td>${r.keterangan || "-"}</td>
                <td>
                    <button class="btn-edit" data-id="${r.id}" data-jumlah="${r.jumlah}" data-tanggal="${r.tanggal}" data-ket="${r.keterangan}">✏️</button>
                    <button class="btn-hapus" data-id="${r.id}">🗑️</button>
                </td>
            </tr>
        `;
    });

    attachPengeluaranActions();
}

function attachPengeluaranActions() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const jumlah = btn.dataset.jumlah;
            const tanggal = btn.dataset.tanggal;
            const ket = btn.dataset.ket;

            const { value } = await Swal.fire({
                title: 'Edit Pengeluaran',
                html:
                    `<input id="sw_jumlah" class="swal2-input" value="${jumlah}">` +
                    `<input id="sw_tanggal" type="date" class="swal2-input" value="${tanggal}">` +
                    `<input id="sw_ket" class="swal2-input" value="${ket}">`,
                preConfirm: () => ({
                    jumlah: document.getElementById('sw_jumlah').value,
                    tanggal: document.getElementById('sw_tanggal').value,
                    keterangan: document.getElementById('sw_ket').value
                })
            });
            if (!value) return;

            const res = await editPengeluaran(id, value.jumlah, value.tanggal, value.keterangan);
            if (res.status === "success") {
                Swal.fire("Sukses", "Data diperbarui.", "success");
                loadAll();
            }
        };
    });

    document.querySelectorAll(".btn-hapus").forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const ok = await Swal.fire({
                title: "Hapus pengeluaran?",
                icon: "warning",
                showCancelButton: true
            });
            if (!ok.isConfirmed) return;

            const res = await hapusPengeluaran(id);
            if (res.status === "success") {
                Swal.fire("Dihapus", "Berhasil dihapus", "success");
                loadAll();
            }
        };
    });
}

function numberWithCommas(x) {
    return Number(x || 0).toLocaleString();
}

/* init */
(async function () {
    initMonthYearSelectors();
    await loadAll();
})();
