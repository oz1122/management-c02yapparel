// assets/js/transaksi.js
import { supabase } from "./supabase.js";

/* CONFIG */
const limit = 7;
let currentPage = 1;
let currentQuery = "";

/* DOM */
const tableBody = document.getElementById("tableBody");
const pageInfo = document.getElementById("pageInfo");
const paginationControls = document.getElementById("paginationControls");
const totalCountEl = document.getElementById("totalCount");
const searchInput = document.getElementById("searchInput");

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  loadTransactions(1);
  searchInput.addEventListener("input", debounce(()=>{
    currentQuery = searchInput.value.trim();
    loadTransactions(1);
  }, 300));
});

/* LOAD DATA */
async function loadTransactions(page = 1) {
  currentPage = page;
  const start = (page-1)*limit;
  const end = start + limit - 1;

  let base = supabase.from("pesanan").select("*", { count: "exact" });
  if (currentQuery) base = base.ilike("nama_pelanggan", `%${currentQuery}%`);

  const { data: pesananRows, count, error } = await base
    .order("id", { ascending: false })
    .range(start, end);

  if (error) {
    console.error(error);
    Swal.fire("Error","Gagal memuat transaksi","error");
    return;
  }

  totalCountEl.textContent = `Total ${count ?? 0} transaksi`;

  if (!pesananRows || pesananRows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#777;">🔍 Tidak ada data transaksi.</td></tr>`;
    renderPagination(count||0, page);
    return;
  }

  const ids = pesananRows.map(r=>r.id);
  const { data: pembayaranRows } = await supabase
    .from("pembayaran")
    .select("pesanan_id, total_pembayaran")
    .in("pesanan_id", ids);

  const mapPembayaran = {};
  (pembayaranRows||[]).forEach(p=>{
    mapPembayaran[p.pesanan_id] = (mapPembayaran[p.pesanan_id] || 0) + Number(p.total_pembayaran || 0);
  });

  tableBody.innerHTML = "";
  let no = start + 1;

  for (const r of pesananRows) {
    const totalHarga = Number(r.total_harga || 0);
    const totalBayar = Number(mapPembayaran[r.id] || 0);
    const sisa = totalHarga - totalBayar;
    const sisaColor = sisa <= 0 ? "green" : "red";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${no++}</td>
      <td>${escapeHtml(r.nama_pelanggan || "")}</td>
      <td>Rp ${numberWithCommas(totalHarga)}</td>
      <td>Rp ${numberWithCommas(totalBayar)}</td>
      <td style="color:${sisaColor}">Rp ${numberWithCommas(sisa)}</td>
      <td class="aksi-wrapper">
        <button class="btn-detail" data-id="${r.id}">⋮</button>
        <div class="dropdown-menu" id="menu${r.id}" style="display:none;">
          <a href="view_transaksi.html?id=${r.id}">👁️ <span>Lihat Detail</span></a>
          <a href="javascript:void(0)" data-bayar-id="${r.id}" data-sisa="${sisa}">💰 <span>Bayar</span></a>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  }

  attachDropdownHandlers();
  attachBayarHandlers();
  renderPagination(count||0, page);
}

/* PAGINATION */
function renderPagination(totalItems, page) {
  const totalPages = Math.max(1, Math.ceil((totalItems||0)/limit));
  pageInfo.textContent = `Page ${page} of ${totalPages}`;
  let html = "";

  if (page > 1) html += `<button class="page-btn" id="prevBtn">Previous</button>`;
  if (page < totalPages) html += `<button class="page-btn" id="nextBtn">Next</button>`;

  paginationControls.innerHTML = html;
  document.getElementById("prevBtn")?.addEventListener("click", ()=> loadTransactions(page-1));
  document.getElementById("nextBtn")?.addEventListener("click", ()=> loadTransactions(page+1));
}

/* DROPDOWN */
function attachDropdownHandlers(){
  document.querySelectorAll(".btn-detail").forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      const id = btn.dataset.id;

      document.querySelectorAll(".dropdown-menu").forEach(d=>{
        if (d.id !== `menu${id}`) d.style.display = "none";
      });

      const menu = document.getElementById("menu"+id);
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    };
  });

  document.addEventListener("click", function(e){
    if (!e.target.classList.contains("btn-detail"))
      document.querySelectorAll(".dropdown-menu").forEach(el=>el.style.display="none");
  });
}

/* PEMBAYARAN */
function attachBayarHandlers(){
  document.querySelectorAll("[data-bayar-id]").forEach(el=>{
    el.onclick = async ()=>{

      const pesanan_id = el.dataset.bayarId; // FIX: UUID harus string
      const sisa = Number(el.dataset.sisa);

      const result = await Swal.fire({
        title: "Pembayaran",
        html: `
          <div style="text-align:left; font-size:14px; margin-bottom:8px;">
            Sisa Pembayaran: <b>Rp ${numberWithCommas(sisa)}</b>
          </div>
          <input id="jumlah" type="number" class="swal2-input" placeholder="Jumlah bayar">
          <input id="ket" type="text" class="swal2-input" placeholder="Keterangan (opsional)">
        `,
        showCancelButton:true,
        confirmButtonText:"Bayar Sekarang",
        cancelButtonText:"Batal",
        preConfirm: () => {
          const jml = parseInt(document.getElementById("jumlah").value || 0);
          if (!jml || jml <= 0) { Swal.showValidationMessage("Jumlah pembayaran harus diisi!"); return false; }
          if (jml > sisa) { Swal.showValidationMessage("Pembayaran tidak boleh melebihi sisa pembayaran!"); return false; }
          return { jumlah: jml, keterangan: document.getElementById("ket").value || "" };
        }
      });

      if (!result.isConfirmed) return;

      const { jumlah, keterangan } = result.value;

      /* INSERT PEMBAYARAN */
      const { error: insertErr } = await supabase.from("pembayaran").insert([{
        pesanan_id,  // sudah benar string UUID
        total_pembayaran: jumlah,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        keterangan
      }]);

      if (insertErr) {
        console.error("Gagal menyimpan pembayaran:", insertErr);
        return Swal.fire("Error", "Gagal menyimpan pembayaran: " + insertErr.message, "error");
      }

      /* RECOUNT STATUS */
      const { data: pagos } = await supabase
        .from("pembayaran")
        .select("total_pembayaran")
        .eq("pesanan_id", pesanan_id);

      const totalBayar = (pagos || []).reduce((s, x) => s + Number(x.total_pembayaran || 0), 0);

      const { data: pesananRow } = await supabase
        .from("pesanan")
        .select("total_harga")
        .eq("id", pesanan_id)
        .single();

      const totalHarga = Number(pesananRow?.total_harga || 0);

      let newStatus = "Belum Bayar";
      if (totalBayar >= totalHarga) newStatus = "Lunas";
      else if (totalBayar > (totalHarga * 0.60)) newStatus = "Belum Lunas";
      else if (totalBayar > 0) newStatus = "DP";

      await supabase.from("pesanan").update({ status_pembayaran: newStatus }).eq("id", pesanan_id);

      Swal.fire({ icon:"success", title:"Pembayaran berhasil dicatat!", timer:1400, showConfirmButton:false });
      setTimeout(()=> loadTransactions(currentPage), 600);
    };
  });
}

/* UTIL */
function numberWithCommas(x){ return Number(x||0).toLocaleString(); }
function escapeHtml(unsafe){ if(!unsafe) return ""; return unsafe.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function debounce(fn, ms=250){ let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); }; }
