// ============================================================
// SUPABASE IMPORT
// ============================================================
import { supabase } from "../js/supabase.js";

let limit = 7;
let currentPage = 1;

// Load awal
loadPesanan();

/* ============================================================
   GET TOTAL PESANAN SELURUH TABLE
============================================================ */
async function getTotalPesanan() {
    const { count, error } = await supabase
        .from("pesanan")
        .select("*", { count: "exact", head: true });

    if (error) {
        console.error("Error count:", error);
        return 0;
    }

    return count ?? 0;
}

/* ============================================================
   LOAD DATA
============================================================ */
async function loadPesanan(page = 1) {
    currentPage = page;

    // ambil total pesanan dari seluruh tabel (bukan per page)
    const totalPesanan = await getTotalPesanan();
    document.getElementById("totalPesanan").textContent = `Total ${totalPesanan} pesanan`;

    const search = document.getElementById("searchInput").value.trim();
    const status = document.getElementById("filterStatus").value;

    let query = supabase.from("pesanan").select("*", { count: "exact" });

    if (search) query = query.ilike("nama_pelanggan", `%${search}%`);
    if (status) query = query.eq("status_pembayaran", status);

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(start, end);

    if (error) return console.error(error);

    renderTable(data || []);
    renderPagination(count || 0, page);
}

/* ============================================================
   RENDER TABLE
============================================================ */
function renderTable(rows) {
    const body = document.getElementById("tableBody");
    body.innerHTML = "";

    let no = (currentPage - 1) * limit + 1;

    rows.forEach(row => {
        let badgeClass = "belumbayar";
        if (row.status_pembayaran === "DP") badgeClass = "dp";
        if (row.status_pembayaran === "Belum Lunas") badgeClass = "belumlunas";
        if (row.status_pembayaran === "Lunas") badgeClass = "lunas";

        body.innerHTML += `
            <tr>
                <td>${no++}</td>

                <td class="nama-pelanggan">
                    ${row.nama_pelanggan}<br>
                    <span class="telepon">${row.no_telepon ?? ""}</span>
                </td>

                <td>${row.jumlah_pemesanan} pcs</td>
                <td>${formatTanggal(row.tanggal_pemesanan)}</td>
                <td>${row.bahan ?? ""}</td>

                <td><span class="badge ${badgeClass}">${row.status_pembayaran}</span></td>

                <td class="aksi-wrapper">
                    <button class="btn-detail" data-menu="${row.id}">⋮</button>

                    <div class="dropdown-menu" id="menu${row.id}">
                        <a href="view_pesanan.html?id=${row.id}">👁️ Lihat</a>
                        <a data-hapus="${row.id}">🗑️ Hapus</a>
                    </div>
                </td>
            </tr>
        `;
    });
}

/* ============================================================
   EVENT DELEGATION — FIX UTAMA
============================================================ */
document.addEventListener("click", function (e) {

    /** 1. Klik tombol titik tiga */
    if (e.target.matches(".btn-detail")) {
        e.stopPropagation();

        let id = e.target.dataset.menu;
        document.querySelectorAll(".dropdown-menu").forEach(el => el.style.display = "none");

        const menu = document.getElementById("menu" + id);
        menu.style.display = menu.style.display === "block" ? "none" : "block";
        return;
    }

    /** 2. Klik tombol Hapus */
    if (e.target.matches("[data-hapus]")) {
        let id = e.target.dataset.hapus;
        hapusPesanan(id);
        return;
    }

    /** 3. Klik di luar dropdown → tutup */
    if (!e.target.closest(".aksi-wrapper")) {
        document.querySelectorAll(".dropdown-menu").forEach(el => el.style.display = "none");
    }
});

/* ============================================================
   DELETE DATA
============================================================ */
async function hapusPesanan(id) {
    Swal.fire({
        title: "Hapus pesanan?",
        text: "Data tidak dapat dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
    }).then(async (result) => {
        if (result.isConfirmed) {
            await supabase.from("pesanan").delete().eq("id", id);
            loadPesanan(currentPage);
        }
    });
}

/* ============================================================
   PAGINATION
============================================================ */
function renderPagination(total, page) {
    const totalPages = Math.ceil(total / limit);
    document.getElementById("pageInfo").textContent = `Page ${page} of ${totalPages}`;

    let html = "";
    if (page > 1) html += `<button class="page-btn" onclick="loadPesanan(${page - 1})">Previous</button>`;
    if (page < totalPages) html += `<button class="page-btn" onclick="loadPesanan(${page + 1})">Next</button>`;
    document.getElementById("paginationControls").innerHTML = html;
}

/* ============================================================
   FORMAT TANGGAL
============================================================ */
function formatTanggal(tgl) {
    if (!tgl) return "";
    return new Date(tgl).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* ============================================================
   SEARCH & FILTER
============================================================ */
document.getElementById("searchInput").addEventListener("input", () => loadPesanan(1));
document.getElementById("filterStatus").addEventListener("change", () => loadPesanan(1));

window.loadPesanan = loadPesanan;
