// assets/js/tambah_pesanan.js
import { supabase } from "./supabase.js";

/* CONFIG */
const BUCKET = "desain";

/* ELEMENTS */
const i_nama = document.getElementById("i_nama");
const i_telepon = document.getElementById("i_telepon");
const i_jumlah = document.getElementById("i_jumlah");
const i_harga = document.getElementById("i_harga");
const i_email = document.getElementById("i_email");
const i_alamat = document.getElementById("i_alamat");
const i_status = document.getElementById("i_status");
const i_total = document.getElementById("i_total");

const i_nama_produk = document.getElementById("i_nama_produk");
const i_deskripsi = document.getElementById("i_deskripsi");

const i_kerah = document.getElementById("i_kerah");
const i_rib = document.getElementById("i_rib");

const i_kategori = document.getElementById("i_kategori");
const i_bahan = document.getElementById("i_bahan");

const i_estimasi = document.getElementById("i_estimasi");
const i_tanggal_pesan = document.getElementById("i_tanggal_pesan");

const detailItemsWrapper = document.getElementById("detailItemsWrapper");

const btnSubmit = document.getElementById("btnSubmit");
const btnCancel = document.getElementById("btnCancel");
const uploadInput = document.getElementById("upload_desain");
const thumbList = document.getElementById("thumbList");
const previewImg = document.getElementById("preview");
const btnAddImage = document.getElementById("btnAddImage");

/* STATE */
let daftarGambar = []; // { name, url }
let indexPreview = 0;
let hargaPaket = 0;
let paketPilihan = "";

/* HELPERS */
function showError(message, inputId = null) {
  Swal.fire({ icon: "error", title: "Gagal!", text: message });
  if (inputId) {
    const el = document.getElementById(inputId);
    if (el) {
      el.classList.add("error-field");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.classList.remove("error-field"), 2000);
    }
  }
}
function numberWithCommas(x){ return Number(x||0).toLocaleString(); }
function escapeHtml(s){ if(!s) return ""; return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

/* DETAIL ITEMS */
function createDetailItem(index){
  return `
    <tr class="detail-item">
      <td style="text-align:center;">${index+1}</td>
      <td><input type="text" class="detail-nama" placeholder="Nama Punggung"></td>
      <td><input type="text" class="detail-nomor" placeholder="00"></td>
      <td>
        <select class="detail-ukuran">
          <option>S</option><option>M</option><option>L</option>
          <option>XL</option><option>XXL</option>
          <option>3XL</option><option>4XL</option>
        </select>
      </td>
      <td>
        <select class="detail-lengan">
          <option value="Short Sleeve">Short Sleeve</option>
          <option value="Long Sleeve">Long Sleeve (+10.000)</option>
        </select>
      </td>
    </tr>
  `;
}
function renderDetailItems(count){
  detailItemsWrapper.innerHTML = "";
  for(let i=0;i<count;i++) detailItemsWrapper.insertAdjacentHTML("beforeend", createDetailItem(i));
  document.querySelectorAll(".detail-ukuran, .detail-lengan").forEach(el=>el.onchange=hitungHarga);
}

/* UPLOAD & PREVIEW */
// When user clicks thumb-add (some templates use btnAddImage element)
if (btnAddImage) btnAddImage.addEventListener("click", ()=> uploadInput.click());
thumbList.addEventListener("click", (ev)=>{
  if (ev.target.closest(".thumb-add")) uploadInput.click();
});

uploadInput.addEventListener("change", async (e)=>{
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;
  for (const f of files){
    // upload to supabase immediately so we can show public url
    const fname = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${f.name.replace(/\s+/g,"_")}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(fname, f, { cacheControl: '3600', upsert: false });
    if (error) {
      console.error("upload error", error);
      Swal.fire("Gagal upload", error.message || "Kesalahan upload", "error");
      continue;
    }
    // getPublicUrl
    const { data: pu } = supabase.storage.from(BUCKET).getPublicUrl(fname);
    const url = pu?.publicUrl || `/uploads/${fname}`;
    daftarGambar.push({ name: fname, url });
    indexPreview = daftarGambar.length - 1;
    renderThumbnails();
    updatePreview();
  }
  uploadInput.value = "";
});

function renderThumbnails(){
  thumbList.innerHTML = `<div class="thumb-add">+</div>`;
  daftarGambar.forEach((g,i)=>{
    thumbList.insertAdjacentHTML("beforeend", `
      <div class="thumb-item ${i===indexPreview?"active-thumb":""}" data-index="${i}">
        <img src="${g.url}" data-index="${i}">
        <div class="delete-thumb" data-del="${i}">×</div>
      </div>
    `);
  });
  // events
  thumbList.querySelectorAll(".thumb-item img").forEach(img=>{
    img.onclick = (e)=>{
      const idx = parseInt(e.target.dataset.index,10);
      indexPreview = idx;
      updatePreview();
      renderThumbnails();
    };
  });
  thumbList.querySelectorAll(".delete-thumb").forEach(btn=>{
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const idx = parseInt(btn.dataset.del,10);
      const filename = daftarGambar[idx].name;
      const ok = await Swal.fire({
        title: "Hapus gambar ini?",
        text: "File juga akan dihapus dari storage.",
        icon: "warning",
        showCancelButton:true,
        confirmButtonText:"Hapus",
        cancelButtonText:"Batal"
      });
      if (!ok.isConfirmed) return;
      // remove from storage immediately
      const { error } = await supabase.storage.from(BUCKET).remove([filename]);
      if (error) console.warn("hapus storage error", error);
      daftarGambar.splice(idx,1);
      if (indexPreview >= daftarGambar.length) indexPreview = Math.max(0, daftarGambar.length -1);
      updatePreview(); renderThumbnails();
      Swal.fire("Dihapus!", "Gambar dihapus.", "success");
    };
  });
}
function updatePreview(){
  previewImg.src = daftarGambar[indexPreview]?.url || "/c02yapparel/asset/preview.png";
}

/* HARGA */
function hitungHarga(){
  if (!paketPilihan) { i_harga.value = 0; i_total.value = 0; return; }
  const base = parseInt(hargaPaket) || 0;
  const kerah = i_kerah.value || "";
  const kerahExtra = kerah.includes("+5.000")?5000:kerah.includes("+10.000")?10000:kerah.includes("+15.000")?15000:0;
  const ribExtra = i_rib.checked?10000:0;
  const hargaDasar = base + kerahExtra + ribExtra;
  const jumlah = parseInt(i_jumlah.value)||0;
  let extra = 0;
  document.querySelectorAll(".detail-item").forEach(row=>{
    const ukuran = row.querySelector(".detail-ukuran").value;
    const lengan = row.querySelector(".detail-lengan").value;
    if (ukuran==="XXL") extra+=10000;
    if (ukuran==="3XL") extra+=15000;
    if (ukuran==="4XL") extra+=20000;
    if (lengan.includes("Long Sleeve")) extra+=10000;
  });
  const total = (hargaDasar * jumlah) + extra;
  i_harga.value = hargaDasar;
  i_total.value = total;
}

/* PALETTE / PAKET BTN binding */
document.querySelectorAll(".paket-btn").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".paket-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    paketPilihan = btn.dataset.paket;
    hargaPaket = parseInt(btn.dataset.price) || 0;
    hitungHarga();
  };
});

/* VALID + SUBMIT */
btnSubmit.addEventListener("click", async (ev)=>{
  ev.preventDefault();
  if (!i_nama.value.trim()) return showError("Nama wajib diisi!","i_nama");
  if (!i_telepon.value.trim()) return showError("Nomor telepon wajib diisi!","i_telepon");
  if (parseInt(i_jumlah.value) < 12) return showError("Minimal 12 pesanan!","i_jumlah");
  if (!i_nama_produk.value.trim()) return showError("Nama produk wajib diisi!","i_nama_produk");
  if (!paketPilihan) return showError("Paket harus dipilih!");
  if (!i_kategori.value) return showError("Kategori wajib diisi!","i_kategori");
  if (!i_bahan.value) return showError("Bahan wajib diisi!","i_bahan");
  if (!i_tanggal_pesan.value) return showError("Tanggal pemesanan wajib!","i_tanggal_pesan");
  if (!i_estimasi.value) return showError("Estimasi selesai wajib!","i_estimasi");
  if (new Date(i_estimasi.value) <= new Date(i_tanggal_pesan.value)) return showError("Estimasi harus lebih besar dari tanggal pemesanan!","i_estimasi");

  const confirm = await Swal.fire({
    title: "Simpan Pesanan?",
    text: "Pastikan data sudah benar.",
    icon: "question",
    showCancelButton:true,
    confirmButtonText:"Ya, Simpan",
    cancelButtonText:"Batal"
  });
  if (!confirm.isConfirmed) return;

  // prepare pesanan payload
  const pesananPayload = {
    nama_pelanggan: i_nama.value.trim(),
    no_telepon: i_telepon.value.trim(),
    email: i_email.value.trim() || null,
    alamat: i_alamat.value.trim() || null,
    jumlah_pemesanan: parseInt(i_jumlah.value)||0,
    harga_satuan: parseInt(i_harga.value)||0,
    total_harga: parseInt(i_total.value)||0,
    status_pembayaran: i_status.value || "Belum Bayar",
    nama_produk: i_nama_produk.value.trim(),
    deskripsi_produk: i_deskripsi.value.trim() || null,
    paket: paketPilihan || null,
    paket_harga: hargaPaket || 0,
    kerah: i_kerah.value || null,
    rib: i_rib.checked?1:0,
    kategori: i_kategori.value || null,
    bahan: i_bahan.value || null,
    tanggal_pemesanan: i_tanggal_pesan.value || null,
    estimasi_selesai: i_estimasi.value || null,
    created_at: new Date().toISOString()
  };

  // 1) insert pesanan
  const { data: insertData, error: insertErr } = await supabase.from("pesanan").insert([pesananPayload]).select().single();
  if (insertErr) {
    console.error(insertErr);
    return Swal.fire("Error", "Gagal menyimpan pesanan: " + insertErr.message, "error");
  }
  const pesananId = insertData.id;

  // 2) insert detail rows
  const detailRows = [];
  document.querySelectorAll("#detailItemsWrapper .detail-item").forEach(tr=>{
    detailRows.push({
      pesanan_id: pesananId,
      nama_punggung: tr.querySelector(".detail-nama").value || null,
      nomor_punggung: tr.querySelector(".detail-nomor").value || null,
      ukuran: tr.querySelector(".detail-ukuran").value || null,
      jenis_lengan: tr.querySelector(".detail-lengan").value || null
    });
  });
  if (detailRows.length) {
    const { error: dErr } = await supabase.from("pesanan_detail").insert(detailRows);
    if (dErr) console.warn("detail insert error", dErr);
  }

  // 3) insert gambar meta (daftarGambar sudah berisi names)
  if (daftarGambar.length) {
    const gambarRows = daftarGambar.map(g=>({ pesanan_id: pesananId, file_name: g.name }));
    const { error: gErr } = await supabase.from("pesanan_gambar").insert(gambarRows);
    if (gErr) console.warn("gambar insert error", gErr);
  }

  // 4) if status is DP -> create DP pembayaran 60% if not exists
  if (pesananPayload.status_pembayaran === "DP") {
    const dpAmount = Math.round((pesananPayload.total_harga || 0) * 0.6);
    // check existing DP record
    const { data: dpExisting } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("pesanan_id", pesananId)
      .ilike("keterangan", "%DP%")
      .limit(1)
      .single();
    if (!dpExisting) {
      await supabase.from("pembayaran").insert([{
        pesanan_id: pesananId,
        total_pembayaran: dpAmount,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        keterangan: "DP 60% otomatis"
      }]);
    } else {
      // update existing DP to 60% (optional)
      await supabase.from("pembayaran").update({ total_pembayaran: dpAmount }).eq("id", dpExisting.id);
    }
  }

  Swal.fire({ icon: "success", title: "Berhasil!", text: "Pesanan berhasil disimpan.", timer:1500, showConfirmButton:false });
  setTimeout(()=> window.location.href = "pesanan.html", 1000);
});

/* INIT */
document.addEventListener("DOMContentLoaded", ()=>{
  renderDetailItems(parseInt(i_jumlah.value||1));
  renderThumbnails();
  updatePreview();
  // basic binding
  i_kerah?.addEventListener("change", hitungHarga);
  i_rib?.addEventListener("change", hitungHarga);
  i_jumlah?.addEventListener("change", ()=>{ renderDetailItems(parseInt(i_jumlah.value||1)); hitungHarga(); });
  if (btnCancel) btnCancel.addEventListener("click",(e)=>{ e.preventDefault(); window.location.href="pesanan.html"; });
});
