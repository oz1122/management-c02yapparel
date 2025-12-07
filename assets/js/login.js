import { supabase } from "./supabase.js";

const btnLogin = document.getElementById("btnLogin");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

btnLogin.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        Swal.fire({
            icon: "warning",
            title: "Input Kosong",
            text: "Email dan password wajib diisi!"
        });
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        Swal.fire({
            icon: "error",
            title: "Login Gagal",
            text: "Email atau password salah!"
        });
        return;
    }

    Swal.fire({
        icon: "success",
        title: "Berhasil Login",
        text: "Selamat datang!",
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        window.location.href = "dashboard.html";
    });
});
