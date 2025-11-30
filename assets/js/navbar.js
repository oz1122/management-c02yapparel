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
    // AMBIL DATA PROFIL
    // ============================
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    // SET NAMA
    const nameElement = document.getElementById("profileName");
    if (nameElement) {
        nameElement.textContent = profile?.full_name || auth.user.email;
    }

    // SET FOTO PROFIL
    const imgElement = document.getElementById("profileImg");
    let finalImage = "assets/img/default.png";

    if (profile?.profile_image) {
        const PROJECT_REF = "diyxtkreoplqmzkhzgci";
        const BUCKET = "profile_image";

        finalImage = `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}/${profile.profile_image}`;
    }

    if (imgElement) imgElement.src = finalImage;

    // ============================
    // AUTO SET PAGE TITLE (FIX)
    // ============================
    const titleElement = document.getElementById("pageTitle");
    if (titleElement) {
        titleElement.textContent = document.title; // <-- AMBIL LANGSUNG DARI <title>
    }

    // ============================
    // ACTIVE MENU
    // ============================
    const path = window.location.pathname;

    const menuMap = {
        "dashboard": "menu-dashboard",
        "/dashboard.html": "menu-dashboard",

        "/pesanan": "menu-pesanan",
        "/pesanan.html": "menu-pesanan",
        "/tambah_pesanan": "menu-pesanan",
        "/view_pesanan": "menu-pesanan",

        "/transaksi": "menu-transaksi",
        "/view_transaksi": "menu-transaksi",

        "/keuangan": "menu-keuangan",
        "/keuangan.html": "menu-keuangan",

        "/pengaturan": "menu-pengaturan",
        "/pengaturan.html": "menu-pengaturan",
    };

    Object.keys(menuMap).forEach(route => {
        if (path.includes(route)) {
            const activeEl = document.getElementById(menuMap[route]);
            if (activeEl) activeEl.classList.add("active");
        }
    });

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

