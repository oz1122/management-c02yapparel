// assets/js/aksi_pengeluaran.js
import { supabase } from "./supabase.js";

export async function tambahPengeluaran(jumlah, tanggal, keterangan) {
    if (!jumlah || !tanggal || !keterangan) {
        return { status: "error", msg: "empty" };
    }
    const { error } = await supabase
        .from("pengeluaran")
        .insert([{ jumlah, tanggal, keterangan }]);
    if (error) return { status: "error", msg: error.message };
    return { status: "success", msg: "added" };
}

export async function editPengeluaran(id, jumlah, tanggal, keterangan) {
    if (!jumlah || !tanggal || !keterangan) {
        return { status: "error", msg: "empty" };
    }
    const { error } = await supabase
        .from("pengeluaran")
        .update({ jumlah, tanggal, keterangan })
        .eq("id", id);
    if (error) return { status: "error", msg: error.message };
    return { status: "success", msg: "updated" };
}

export async function hapusPengeluaran(id) {
    const { error } = await supabase
        .from("pengeluaran")
        .delete()
        .eq("id", id);
    if (error) return { status: "error", msg: error.message };
    return { status: "success", msg: "deleted" };
}
