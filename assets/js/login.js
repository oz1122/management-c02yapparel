import { supabase } from "./supabase.js";

const btnLogin = document.getElementById("btnLogin");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");

btnLogin.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        alert("Email dan password wajib diisi!");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login gagal: " + error.message);
        return;
    }

    alert("Login Berhasil!");
    window.location.href = "dashboard.html";
});
