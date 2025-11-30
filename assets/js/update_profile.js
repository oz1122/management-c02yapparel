// assets/js/update_profile.js
import { supabase } from "./supabase.js";

const BUCKET = "profile_image";

const profileImgEl = document.getElementById("profile-img-preview");
const inputFile = document.getElementById("profile_image_input");
const fullNameInput = document.getElementById("full_name");
const usernameInput = document.getElementById("username");
const btnSaveProfile = document.getElementById("btnSaveProfile");

let currentProfile = null;
let selectedFile = null;

function alertSuccess(msg) {
    Swal.fire({ icon: "success", title: "Berhasil", text: msg });
}

function alertError(msg) {
    Swal.fire({ icon: "error", title: "Gagal", text: msg });
}

/* ============================
   Load Profile dari Supabase
================================ */
export async function loadProfile() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return (window.location.href = "login.html");

    const userId = auth.user.id;

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    currentProfile = data || {};

    fullNameInput.value = currentProfile.full_name ?? "";
    usernameInput.value = currentProfile.username ?? "";

    // tampilkan foto
    if (currentProfile.profile_image) {
        const PROJECT = "diyxtkreoplqmzkhzgci";
        profileImgEl.src =
            `https://${PROJECT}.supabase.co/storage/v1/object/public/${BUCKET}/${currentProfile.profile_image}`;
    } else {
        profileImgEl.src = "assets/img/profile-default.png";
    }
}

/* ============================
   Preview Gambar
================================ */
inputFile.addEventListener("change", () => {
    const f = inputFile.files[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
        return alertError("File bukan gambar!");
    }
    if (f.size > 5 * 1024 * 1024) {
        return alertError("Ukuran maksimal 5MB.");
    }

    selectedFile = f;

    const reader = new FileReader();
    reader.onload = e => (profileImgEl.src = e.target.result);
    reader.readAsDataURL(f);
});

/* ============================
   Hapus Foto Lama (storage)
================================ */
async function deleteOldImage(filename) {
    if (!filename) return;

    await supabase.storage
        .from(BUCKET)
        .remove([filename]);  // <-- hapus file lama dari storage
}

/* ============================
   Upload Foto Baru (storage)
================================ */
async function uploadImage(file, userId) {
    const ext = file.name.split(".").pop();
    const name = `${userId}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(name, file, { upsert: true });

    if (error) throw new Error(error.message);

    return name; // hanya nama file
}

/* ============================
   Simpan Perubahan Profil
================================ */
btnSaveProfile.addEventListener("click", async () => {
    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = "Menyimpan...";

    try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user.id;

        let newFileName = currentProfile.profile_image;

        // Jika ada file baru → upload → hapus file lama
        if (selectedFile) {
            const uploaded = await uploadImage(selectedFile, userId);

            // Hapus foto lama di storage
            await deleteOldImage(currentProfile.profile_image);

            newFileName = uploaded;
        }

        // Simpan update profil
        const { error } = await supabase
            .from("profiles")
            .update({
                full_name: fullNameInput.value,
                username: usernameInput.value,
                profile_image: newFileName
            })
            .eq("id", userId);

        if (error) throw new Error(error.message);

        alertSuccess("Profil berhasil diperbarui!");
        selectedFile = null;

        await loadProfile();

    } catch (err) {
        alertError(err.message);
    }

    btnSaveProfile.disabled = false;
    btnSaveProfile.textContent = "Simpan Perubahan";
});

/* ============================
   Init
================================ */
loadProfile();
