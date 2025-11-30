// assets/js/change_password.js
import { supabase } from "./supabase.js";

const oldPass = document.getElementById("old_password");
const newPass = document.getElementById("new_password");
const confirmPass = document.getElementById("confirm_password");
const btnChangePassword = document.getElementById("btnChangePassword");

function alertSuccess(msg) {
    Swal.fire({ icon: "success", title: "Berhasil", text: msg });
}
function alertError(msg) {
    Swal.fire({ icon: "error", title: "Gagal", text: msg });
}

/* ============================
   Ubah Password
================================ */
btnChangePassword.addEventListener("click", async () => {
    const oldP = oldPass.value.trim();
    const newP = newPass.value.trim();
    const confP = confirmPass.value.trim();

    if (!oldP || !newP || !confP) return alertError("Semua kolom wajib diisi.");
    if (newP !== confP) return alertError("Password baru tidak cocok.");
    if (newP.length < 8) return alertError("Minimal 8 karakter.");

    btnChangePassword.disabled = true;
    btnChangePassword.textContent = "Mengubah...";

    try {
        const { data: auth } = await supabase.auth.getUser();
        const email = auth.user.email;

        // verifikasi password lama
        const { error: errLogin } = await supabase.auth.signInWithPassword({
            email,
            password: oldP
        });

        if (errLogin) throw new Error("Password lama salah");

        // update password baru
        const { error } = await supabase.auth.updateUser({ password: newP });
        if (error) throw new Error(error.message);

        alertSuccess("Password berhasil diubah!");
        oldPass.value = newPass.value = confirmPass.value = "";

    } catch (err) {
        alertError(err.message);
    }

    btnChangePassword.disabled = false;
    btnChangePassword.textContent = "Ganti Password";
});
