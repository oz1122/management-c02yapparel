// simpan_pembayaran.js
import { supabase } from "./supabase.js";

export async function simpanPembayaran(pesanan_id, jumlah) {

    const { error } = await supabase
        .from("pembayaran")
        .insert({
            pesanan_id,
            jumlah,
            tanggal: new Date().toISOString()
        });

    if (error) {
        Swal.fire("Error", error.message, "error");
        return false;
    }

    Swal.fire("Berhasil!", "Pembayaran disimpan.", "success");
    return true;
}
