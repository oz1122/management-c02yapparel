// search_transaksi.js
import { supabase } from "./supabase.js";

export async function cariTransaksi(keyword) {
    const { data, error } = await supabase
        .from("pesanan")
        .select("*")
        .ilike("nama_pelanggan", `%${keyword}%`);

    if (error) console.error(error);

    return data || [];
}
