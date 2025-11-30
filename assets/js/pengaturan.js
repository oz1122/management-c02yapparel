// assets/js/pengaturan.js
import { supabase } from "./supabase.js";

const BUCKET = "profile_image";
const profileImgEl = document.getElementById("profile-img-preview");
const inputFile = document.getElementById("profile_image_input");
const fullNameInput = document.getElementById("full_name");
const usernameInput = document.getElementById("username");
const btnSaveProfile = document.getElementById("btnSaveProfile");

const oldPasswordInput = document.getElementById("old_password");
const newPasswordInput = document.getElementById("new_password");
const confirmPasswordInput = document.getElementById("confirm_password");
const btnChangePassword = document.getElementById("btnChangePassword");

let currentProfile = null;
let selectedFile = null;

/* ================================
   Helper SweetAlert
================================ */
function alertSuccess(msg) {
    Swal.fire({ icon: "success", title: "Berhasil", text: msg });
}
function alertError(msg) {
    Swal.fire({ icon: "error", title: "Gagal", text: msg });
}

/* ================================
   Load Profile Data
================================ */
async function loadProfile() {

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
        window.location.href = "login.html";
        return;
    }

    const userId = auth.user.id;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    currentProfile = data || {};

    fullNameInput.value = currentProfile.full_name || "";
    usernameInput.value = currentProfile.username || "";

    // tampilkan foto (pakai URL gabungan)
    if (currentProfile.profile_image) {
        const PROJECT_REF = "diyxtkreoplqmzkhzgci";
        profileImgEl.src =
            `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}/${currentProfile.profile_image}`;
    } else {
        profileImgEl.src = "assets/img/profile-default.png";
    }
}

/* ================================
   Preview Image
================================ */
inputFile.addEventListener("change", () => {
    const file = inputFile.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alertError("File bukan gambar.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alertError("Ukuran maksimal 5MB.");
        return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = e => profileImgEl.src = e.target.result;
    reader.readAsDataURL(file);
});

/* ================================
   Upload ke Storage (return nama file)
================================ */
async function uploadImage(file, userId) {

    const ext = file.name.split(".").pop();
    const fileName = `${userId}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, { upsert: true });

    if (error) throw new Error(error.message);

    // return HANYA nama file
    return fileName;
}

/* ================================
   Simpan Profil
================================ */
btnSaveProfile.addEventListener("click", async () => {

    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = "Menyimpan...";

    try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user.id;

        let newFileName = currentProfile.profile_image || null;

        // upload gambar baru jika ada
        if (selectedFile) {
            newFileName = await uploadImage(selectedFile, userId);
        }

        const payload = {
            id: userId,
            full_name: fullNameInput.value,
            username: usernameInput.value,
            profile_image: newFileName
        };

        // upsert ke tabel profiles
        const { error } = await supabase
            .from("profiles")
            .upsert(payload);

        if (error) throw new Error(error.message);

        alertSuccess("Profil berhasil diperbarui.");

        selectedFile = null;
        await loadProfile();

    } catch (err) {
        alertError(err.message);
    }

    btnSaveProfile.disabled = false;
    btnSaveProfile.textContent = "Simpan Perubahan";
});

/* ================================
   Ubah Password
   (cek password lama via login)
================================ */
btnChangePassword.addEventListener("click", async () => {

    const oldPwd = oldPasswordInput.value.trim();
    const newPwd = newPasswordInput.value.trim();
    const confirmPwd = confirmPasswordInput.value.trim();

    if (!oldPwd || !newPwd || !confirmPwd) {
        alertError("Semua kolom wajib diisi.");
        return;
    }

    if (newPwd !== confirmPwd) {
        alertError("Password baru tidak cocok.");
        return;
    }

    if (newPwd.length < 8) {
        alertError("Password minimal 8 karakter.");
        return;
    }

    btnChangePassword.disabled = true;
    btnChangePassword.textContent = "Mengubah...";

    try {
        const { data: auth } = await supabase.auth.getUser();
        const email = auth.user.email;

        // cek password lama
        const { error: checkErr } = await supabase.auth.signInWithPassword({
            email,
            password: oldPwd
        });

        if (checkErr) {
            alertError("Password lama salah.");
            throw new Error();
        }

        // update password
        const { error } = await supabase.auth.updateUser({
            password: newPwd
        });

        if (error) throw new Error(error.message);

        alertSuccess("Password berhasil diubah.");

        oldPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";

    } catch (err) {
        if (err?.message) alertError(err.message);
    }

    btnChangePassword.disabled = false;
    btnChangePassword.textContent = "Ganti Password";
});

/* ================================
   INIT
================================ */
loadProfile();
