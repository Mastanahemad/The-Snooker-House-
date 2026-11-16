
import { supabase } from "./supabase";
import { AppData, Booking } from "./types";

export const initialData: AppData = {
  tables: [
    { id: "T1", label: "Table 01", rate: 5, status: "available" },
    { id: "T2", label: "Table 02", rate: 4, status: "available" },
    { id: "T3", label: "Table 03", rate: 4, status: "available" },
  ],
  bookings: [],
};

export async function loadData(): Promise<AppData> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const bookings: Booking[] = (data || []).map((row) => ({
      id: row.app_booking_id || row.id,
      customer: row.customer_name,
      phone: row.mobile,
      tableId: row.table_id || `T${row.table_number}`,
      date: row.booking_date,
      start: row.booking_time,
      hours: Number(row.hours || 1),
      amount: Number(row.amount || 0),
      status: row.status === "cancelled" ? "cancelled" : "confirmed",
    }));

    return {
      ...initialData,
      bookings,
    };
  } catch (error) {
    console.error("Load error:", error);
    return initialData;
  }
}

export async function saveData(data: AppData): Promise<void> {
  if (data.bookings.length === 0) return;

  const rows = data.bookings.map((booking) => ({
    app_booking_id: booking.id,
    customer_name: booking.customer,
    mobile: booking.phone,
    table_id: booking.tableId,
    table_number: Number(booking.tableId.replace(/\D/g, "")) || 0,
    booking_date: booking.date,
    booking_time: booking.start,
    hours: booking.hours,
    amount: booking.amount,
    status: booking.status,
  }));

  const { error } = await supabase
    .from("bookings")
    .upsert(rows, { onConflict: "app_booking_id" });

  if (error) {
    console.error("Save error:", error);
    throw error;
  }
}
