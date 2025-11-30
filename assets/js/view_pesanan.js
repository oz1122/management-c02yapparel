// assets/js/view_pesanan.js
import { supabase } from "./supabase.js";

const BUCKET = "desain";

/* DOM */
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
const previewImg = document.getElementById("preview");
const thumbList = document.getElementById("thumbList");
const uploadInput = document.getElementById("upload_desain");

const btnSubmit = document.getElementById("btnSubmit");
const btnCancel = document.getElementById("btnCancel");

/* STATE */
let daftarGambar = []; // { serverName, publicUrl, isNew, file }
let removedImages = []; // list of serverName to delete from storage on submit
let indexPreview = 0;
let hargaPaket = 0;
let paketPilihan = "";

function showError(msg, inputId=null){
  Swal.fire({ icon: "error", title: "Gagal!", text: msg });
  if (inputId) { const el = document.getElementById(inputId); if (el) { el.classList.add("error-field"); setTimeout(()=>el.classList.remove("error-field"),1500); } }
}
function getIdFromUrl(){ return new URLSearchParams(window.location.search).get("id"); }
function createDetailItem(index){
  return `
    <tr class="detail-item">
      <td style="text-align:center;">${index+1}</td>
      <td><input type="text" class="detail-nama"></td>
      <td><input type="text" class="detail-nomor"></td>
      <td>
        <select class="detail-ukuran">
          <option>S</option><option>M</option><option>L</option>
          <option>XL</option><option>XXL</option><option>3XL</option><option>4XL</option>
        </select>
      </td>
      <td>
        <select class="detail-lengan">
          <option>Short Sleeve</option>
          <option>Long Sleeve (+10.000)</option>
        </select>
      </td>
    </tr>
  `;
}
function renderDetailItems(count){
  detailItemsWrapper.innerHTML = "";
  for(let i=0;i<count;i++) detailItemsWrapper.insertAdjacentHTML("beforeend", createDetailItem(i));
}

/* THUMBNAILS */
function renderThumbnails(){
  thumbList.innerHTML = `<div class="thumb-add">+</div>`;
  daftarGambar.forEach((g,i)=>{
    thumbList.insertAdjacentHTML("beforeend", `
      <div class="thumb-item ${i===indexPreview?"active-thumb":""}">
        <img src="${g.publicUrl}" data-index="${i}">
        <div class="delete-thumb" data-del="${i}">×</div>
      </div>
    `);
  });

  thumbList.querySelector(".thumb-add").onclick = ()=> uploadInput.click();

  thumbList.querySelectorAll(".thumb-item img").forEach(img=>{
    img.onclick = (e)=> { indexPreview = parseInt(e.target.dataset.index,10); updatePreview(); renderThumbnails(); };
  });

  thumbList.querySelectorAll(".delete-thumb").forEach(btn=>{
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const idx = parseInt(btn.dataset.del,10);
      const ok = await Swal.fire({
        title: "Hapus gambar ini?",
        text: "File juga akan dihapus dari storage.",
        icon: "warning",
        showCancelButton:true,
        confirmButtonText:"Hapus",
        cancelButtonText:"Batal"
      });
      if (!ok.isConfirmed) return;
      const item = daftarGambar[idx];
      if (!item.isNew && item.serverName) removedImages.push(item.serverName);
      daftarGambar.splice(idx,1);
      indexPreview = Math.max(0, daftarGambar.length-1);
      updatePreview(); renderThumbnails();
      Swal.fire("Dihapus!", "Gambar berhasil dihapus.", "success");
    };
  });
}
function updatePreview(){ previewImg.src = daftarGambar[indexPreview]?.publicUrl || "/c02yapparel/asset/preview.png"; }

/* UPLOAD */
uploadInput.onchange = async function(e){
  const files = [...e.target.files];
  for (const f of files){
    const name = `${Date.now()}_${f.name.replace(/\s+/g,"_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(name, f);
    if (error) return Swal.fire("Gagal upload!", error.message, "error");
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
    daftarGambar.push({ serverName: name, publicUrl: data.publicUrl, isNew:true, file: f });
  }
  indexPreview = daftarGambar.length - 1;
  updatePreview(); renderThumbnails();
};

/* HARGA (sama) */
function hitungHarga(){
  if (!paketPilihan) { i_harga.value = 0; i_total.value = 0; return; }
  const base = hargaPaket || 0;
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
  i_harga.value = hargaDasar; i_total.value = total;
}

/* LOAD PESANAN */
async function loadPesanan(id){
  const { data: pesanan, error } = await supabase.from("pesanan").select("*").eq("id", id).single();
  if (error || !pesanan) return showError("Gagal memuat pesanan.");
  // fill
  i_nama.value = pesanan.nama_pelanggan || "";
  i_telepon.value = pesanan.no_telepon || "";
  i_jumlah.value = pesanan.jumlah_pemesanan || 1;
  i_harga.value = pesanan.harga_satuan || 0;
  i_email.value = pesanan.email || "";
  i_alamat.value = pesanan.alamat || "";
  i_status.value = pesanan.status_pembayaran || "Belum Bayar";
  i_total.value = pesanan.total_harga || 0;
  i_nama_produk.value = pesanan.nama_produk || "";
  i_deskripsi.value = pesanan.deskripsi_produk || "";
  i_kategori.value = pesanan.kategori || "Jersey Futsal";
  i_bahan.value = pesanan.bahan || "Spandex";
  i_tanggal_pesan.value = pesanan.tanggal_pemesanan || "";
  i_estimasi.value = pesanan.estimasi_selesai || "";
  paketPilihan = pesanan.paket; hargaPaket = pesanan.paket_harga || 0;
  if (paketPilihan) document.querySelector(`.paket-btn[data-paket="${paketPilihan}"]`)?.classList.add("active");

  // details
  const { data: details } = await supabase.from("pesanan_detail").select("*").eq("pesanan_id", id).order("id",{ascending:true});
  renderDetailItems(details?.length || 1);
  details?.forEach((d,i)=>{
    document.querySelectorAll(".detail-nama")[i].value = d.nama_punggung || "";
    document.querySelectorAll(".detail-nomor")[i].value = d.nomor_punggung || "";
    document.querySelectorAll(".detail-ukuran")[i].value = d.ukuran || "S";
    document.querySelectorAll(".detail-lengan")[i].value = d.jenis_lengan || "Short Sleeve";
  });

  // gambar
  const { data: imgs } = await supabase.from("pesanan_gambar").select("*").eq("pesanan_id", id).order("id",{ascending:true});
  daftarGambar = [];
  for (const g of imgs || []) {
    const { data: url } = supabase.storage.from(BUCKET).getPublicUrl(g.file_name);
    daftarGambar.push({ serverName: g.file_name, publicUrl: url.publicUrl, isNew:false, file:null });
  }
  indexPreview = 0;
  renderThumbnails(); updatePreview();
  hitungHarga();
}

/* SUBMIT / UPDATE */
btnSubmit.onclick = async (e)=>{
  e.preventDefault();
  if (!i_nama.value.trim()) return showError("Nama wajib diisi!","i_nama");
  if (!i_telepon.value.trim()) return showError("Telepon wajib diisi!","i_telepon");
  if (parseInt(i_jumlah.value) < 1) return showError("Jumlah minimal 1!","i_jumlah");

  const confirm = await Swal.fire({ title:"Simpan perubahan?", text:"Data akan diperbarui.", icon:"question", showCancelButton:true, confirmButtonText:"Ya, Simpan", cancelButtonText:"Batal" });
  if (!confirm.isConfirmed) return;

  const id = getIdFromUrl();
  const updateObj = {
    nama_pelanggan: i_nama.value,
    no_telepon: i_telepon.value,
    email: i_email.value,
    alamat: i_alamat.value,
    jumlah_pemesanan: parseInt(i_jumlah.value) || 0,
    harga_satuan: parseInt(i_harga.value) || 0,
    total_harga: parseInt(i_total.value) || 0,
    status_pembayaran: i_status.value,
    nama_produk: i_nama_produk.value,
    deskripsi_produk: i_deskripsi.value,
    paket: paketPilihan,
    paket_harga: hargaPaket || 0,
    kerah: i_kerah.value,
    rib: i_rib.checked ? 1 : 0,
    kategori: i_kategori.value,
    bahan: i_bahan.value,
    tanggal_pemesanan: i_tanggal_pesan.value || null,
    estimasi_selesai: i_estimasi.value || null
  };

  // update pesanan
  const { error } = await supabase.from("pesanan").update(updateObj).eq("id", id);
  if (error) return showError("Gagal update pesanan: " + error.message);

  // replace details
  await supabase.from("pesanan_detail").delete().eq("pesanan_id", id);
  const detailRows = [];
  document.querySelectorAll(".detail-item").forEach(tr=>{
    detailRows.push({
      pesanan_id: id,
      nama_punggung: tr.querySelector(".detail-nama").value || null,
      nomor_punggung: tr.querySelector(".detail-nomor").value || null,
      ukuran: tr.querySelector(".detail-ukuran").value || null,
      jenis_lengan: tr.querySelector(".detail-lengan").value || null
    });
  });
  if (detailRows.length) {
    const { error: derr } = await supabase.from("pesanan_detail").insert(detailRows);
    if (derr) console.warn("detail insert error", derr);
  }

  // replace gambar meta (DB)
  await supabase.from("pesanan_gambar").delete().eq("pesanan_id", id);
  const gambarRows = daftarGambar.filter(g=>g.serverName).map(g=>({ pesanan_id: id, file_name: g.serverName }));
  if (gambarRows.length) {
    const { error: gerr } = await supabase.from("pesanan_gambar").insert(gambarRows);
    if (gerr) console.warn("gambar insert error", gerr);
  }

  // delete from storage removedImages
  if (removedImages.length) {
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(removedImages);
    if (rmErr) console.warn("remove storage error", rmErr);
  }

  // if status = DP -> ensure DP pembayaran 60% exists or updated
  if (updateObj.status_pembayaran === "DP") {
    const dpAmount = Math.round((updateObj.total_harga || 0) * 0.6);
    const { data: dpExisting, error: dpErr } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("pesanan_id", id)
      .ilike("keterangan", "%DP%")
      .limit(1)
      .single();
    if (!dpExisting) {
      await supabase.from("pembayaran").insert([{
        pesanan_id: id,
        total_pembayaran: dpAmount,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        keterangan: "DP 60% otomatis"
      }]);
    } else {
      // update to 60% if different
      if (Number(dpExisting.total_pembayaran) !== dpAmount) {
        await supabase.from("pembayaran").update({ total_pembayaran: dpAmount }).eq("id", dpExisting.id);
      }
    }
  }

  Swal.fire({ icon: "success", title: "Berhasil!", text: "Pesanan berhasil diperbarui.", timer:1500, showConfirmButton:false });
  setTimeout(()=> window.location.href = "pesanan.html", 1200);
};

/* CANCEL */
btnCancel.onclick = ()=> window.location.href = "pesanan.html";

/* INIT */
async function init(){
  const id = getIdFromUrl();
  if (!id) return showError("ID pesanan tidak ditemukan.");
  await loadPesanan(id);
  // bind events for price recalculation
  document.querySelectorAll(".paket-btn").forEach(b=>b.onclick=()=>{ document.querySelectorAll(".paket-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active"); paketPilihan=b.dataset.paket; hargaPaket=parseInt(b.dataset.price)||0; hitungHarga(); });
  i_kerah.addEventListener("change", hitungHarga); i_rib.addEventListener("change", hitungHarga);
  i_jumlah.addEventListener("change", ()=>{ renderDetailItems(parseInt(i_jumlah.value||1)); hitungHarga(); });
}
init();
