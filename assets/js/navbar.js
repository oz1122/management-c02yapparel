import { supabase } from "./supabase.js";

async function loadNavbar() {

    // ============================
    // LOAD FILE NAVBAR.HTML
    // ============================
    const html = await fetch("components/navbar.html").then(r => r.text());
    document.getElementById("navbar").innerHTML = html;

    // Tunggu render
    await new Promise(resolve => setTimeout(resolve, 50));

    // ============================
    // CEK USER LOGIN
    // ============================
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
        window.location.href = "login.html";
        return;
    }

    const userId = auth.user.id;

    // ============================
    // AMBIL DATA PROFIL DARI TABEL PROFILES
    // ============================
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    // ============================
    // TAMPILKAN NAMA USER
    // ============================
    const nameElement = document.getElementById("profileName");
    if (nameElement) {
        nameElement.textContent = profile?.full_name || auth.user.email;
    }

    // ============================
    // FOTO PROFIL SUPABASE STORAGE
    // ============================
    const imgElement = document.getElementById("profileImg");
    let finalImage = "assets/img/default.png"; // default

    if (profile?.profile_image) {
        const PROJECT_REF = "diyxtkreoplqmzkhzgci";  
        const BUCKET = "profile_image";              

        finalImage = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}/${profile.profile_image}`;
    }

    if (imgElement) {
        imgElement.src = finalImage;
    }

    // ============================
    // AUTO SET PAGE TITLE
    // ============================
    const pageTitleMap = {
        "dashboard.html": "Dashboard",
        "pesanan.html": "Data Pesanan",
        "tambah_pesanan.html": "Tambah Pesanan",
        "view_pesanan.html": "Detail Pesanan",
        "transaksi.html": "Transaksi",
        "view_transaksi.html": "Detail Transaksi",
        "keuangan.html": "Laporan Keuangan",
        "pengaturan.html": "Pengaturan"
    };

    const currentPage = window.location.pathname.split("/").pop();
    const titleElement = document.getElementById("pageTitle");

    if (titleElement) {
        titleElement.textContent = pageTitleMap[currentPage] || "Untitled Page";
    }

    // ============================
    // AKTIFKAN MENU SESUAI HALAMAN
    // ============================
    const menuMap = {
        "dashboard.html": "menu-dashboard",
        "pesanan.html": "menu-pesanan",
        "tambah_pesanan.html": "menu-pesanan",
        "view_pesanan.html": "menu-pesanan",
        "transaksi.html": "menu-transaksi",
        "view_transaksi.html": "menu-transaksi",
        "keuangan.html": "menu-keuangan",
        "pengaturan.html": "menu-pengaturan",
    };

    if (menuMap[currentPage]) {
        const activeEl = document.getElementById(menuMap[currentPage]);
        if (activeEl) activeEl.classList.add("active");
    }

    // ============================
    // LOGOUT
    // ============================
    const logoutBtn = document.getElementById("btnLogout");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabase.auth.signOut();
            window.location.href = "login.html";
        };
    }
}

loadNavbar();
