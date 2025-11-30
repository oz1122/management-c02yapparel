import { supabase } from "./supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const pesanan_id = urlParams.get("id");

if (!pesanan_id) {
    Swal.fire("Error", "ID Pesanan tidak ditemukan", "error");
}

/* ======================================================
   HARGA KERAH
====================================================== */
const hargaKerahList = {
    "O-Neck (Gratis)": 0,
    "O-Neck Variasi (Gratis)": 0,
    "V-Neck (Gratis)": 0,
    "V-Neck Variasi (Gratis)": 0,
    "V-Neck Semi Adidas (+5.000)": 5000,
    "V Adidas Variasi (Gratis)": 0,
    "Polo V-Neck (+5.000)": 5000,
    "V-Neck Nyamping (Gratis)": 0,
    "Polo V Adidas (+5.000)": 5000,
    "Kerah Polo Panjang (+10.000)": 10000,
    "Kerah Polo Pendek (+10.000)": 10000,
    "Kerah Polo Tali (+15.000)": 15000
};

/* ======================================================
   LOAD DATA UTAMA
====================================================== */
async function loadTransaksi() {

    /* --- PESANAN UTAMA --- */
    const { data: pesanan } = await supabase
        .from("pesanan")
        .select("*")
        .eq("id", pesanan_id)
        .single();

    if (!pesanan) {
        return Swal.fire("Error", "Data pesanan tidak ditemukan", "error");
    }

    /* --- DETAIL LENGAN --- */
    const { data: detail } = await supabase
        .from("pesanan_detail")
        .select("*")
        .eq("pesanan_id", pesanan_id);

    const jumlahLongSleeve = detail.filter(d => d.jenis_lengan === "Long Sleeve").length;
    const totalLongSleeve = jumlahLongSleeve * 10000;

    /* --- PEMBAYARAN --- */
    const { data: bayarRows } = await supabase
        .from("pembayaran")
        .select("*")
        .eq("pesanan_id", pesanan_id)
        .order("tanggal_bayar", { ascending: false });

    const totalBayar = bayarRows.reduce((s, b) => s + Number(b.total_pembayaran), 0);
    const sisa = pesanan.total_harga - totalBayar;

    /* --- KERAH & RIB --- */
    const hargaKerah = hargaKerahList[pesanan.kerah] ?? 0;
    const totalHargaKerah = hargaKerah * pesanan.jumlah_pemesanan;

    const hargaRib = 10000;
    const totalHargaRib = pesanan.rib ? hargaRib * pesanan.jumlah_pemesanan : 0;

    /* ======================================================
       RENDER INVOICE
    ====================================================== */

    document.getElementById("inv_nama").textContent = pesanan.nama_pelanggan;
    document.getElementById("inv_telepon").textContent = pesanan.no_telepon;
    document.getElementById("inv_email").textContent = pesanan.email || "-";
    document.getElementById("inv_alamat").textContent = pesanan.alamat || "-";

    document.getElementById("inv_jumlah").textContent =
        `${pesanan.jumlah_pemesanan} pcs`;

    document.getElementById("inv_paket").innerHTML =
        `${pesanan.paket} — ${pesanan.jumlah_pemesanan} pcs × Rp ${format(pesanan.paket_harga)} 
         = <b>Rp ${format(pesanan.paket_harga * pesanan.jumlah_pemesanan)}</b>`;

    document.getElementById("inv_kerah").innerHTML = `
        ${pesanan.kerah.replace(/\s*\([^)]*\)/, "")} <br>
        ${pesanan.jumlah_pemesanan} pcs × Rp ${format(hargaKerah)} =
        <b>Rp ${format(totalHargaKerah)}</b>
        ${pesanan.rib ? `<br>RIB = ${pesanan.jumlah_pemesanan} × Rp 10.000 = <b>Rp ${format(totalHargaRib)}</b>` : ""}
    `;

    document.getElementById("inv_bahan").textContent = pesanan.bahan;

    document.getElementById("inv_lengan").innerHTML = `
        Short Sleeve = ${pesanan.jumlah_pemesanan - jumlahLongSleeve} pcs<br>
        ${
            jumlahLongSleeve > 0
                ? `Long Sleeve = ${jumlahLongSleeve} pcs × Rp 10.000 = <b>Rp ${format(totalLongSleeve)}</b>`
                : "(Tanpa biaya tambahan)"
        }
    `;

    document.getElementById("inv_total").innerHTML =
        `<b>Rp ${format(pesanan.total_harga)}</b>`;

    document.getElementById("inv_total_bayar").innerHTML =
        `<b>Rp ${format(totalBayar)}</b>`;

    document.getElementById("inv_sisa").innerHTML =
        `<b>Rp ${format(sisa)}</b>`;
    document.getElementById("inv_sisa").style.color = sisa <= 0 ? "green" : "red";


    /* ======================================================
       RENDER RIWAYAT PEMBAYARAN
    ====================================================== */

    const tbody = document.getElementById("paymentsBody");
    tbody.innerHTML = "";

    let no = 1;

    bayarRows.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${no++}</td>
            <td>${formatDate(row.tanggal_bayar)}</td>
            <td>Rp ${format(row.total_pembayaran)}</td>
            <td>${row.keterangan || "-"}</td>
            <td>
                <button class='edit-btn'
                    onclick="editBayar('${row.id}', ${row.total_pembayaran}, '${row.keterangan || ""}')">
                    Edit
                </button>

                <button class='del-btn'
                    onclick="hapusBayar('${row.id}')">
                    Hapus
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* ======================================================
   UTIL
====================================================== */

function format(x) {
    return Number(x).toLocaleString("id-ID");
}

function formatDate(d) {
    return new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* ======================================================
   EDIT PEMBAYARAN
====================================================== */
window.editBayar = async function (id, jumlah_awal, ket_awal = "") {

    const { value: form } = await Swal.fire({
        title: "Edit Pembayaran",
        html: `
            <input id="sw_jumlah" type="number" class="swal2-input"
                   placeholder="Jumlah" value="${jumlah_awal}">
            <input id="sw_ket" type="text" class="swal2-input"
                   placeholder="Keterangan" value="${ket_awal}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
        preConfirm: () => ({
            jumlah: document.getElementById("sw_jumlah").value,
            keterangan: document.getElementById("sw_ket").value
        })
    });

    if (!form) return;
    if (!form.jumlah) {
        return Swal.fire("Error", "Jumlah wajib diisi", "error");
    }

    const { error } = await supabase
        .from("pembayaran")
        .update({
            total_pembayaran: Number(form.jumlah),
            keterangan: form.keterangan
        })
        .eq("id", id);

    if (error) return Swal.fire("Gagal", error.message, "error");

    Swal.fire("Berhasil", "Pembayaran berhasil diperbarui", "success");

    loadTransaksi();
};

/* ======================================================
   HAPUS PEMBAYARAN
====================================================== */
window.hapusBayar = async function (id) {

    const confirm = await Swal.fire({
        title: "Hapus pembayaran?",
        text: "Data tidak bisa dikembalikan.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Hapus",
        cancelButtonText: "Batal"
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
        .from("pembayaran")
        .delete()
        .eq("id", id);

    if (error) return Swal.fire("Gagal", error.message, "error");

    Swal.fire("Dihapus", "Pembayaran berhasil dihapus", "success");

    loadTransaksi();
};

/* ======================================================
   START
====================================================== */
loadTransaksi();
