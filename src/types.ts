
export type TableStatus =
  | "available"
  | "occupied"
  | "maintenance";

export type BookingStatus =
  | "confirmed"
  | "cancelled";

export type SnookerTable = {
  id: string;
  label: string;
  rate: number;
  status: TableStatus;
};

export type Booking = {
  id: string;
  customer: string;
  phone: string;
  tableId: string;
  date: string;
  start: string;
  hours: number;
  amount: number;
  status: BookingStatus;
};

export type AppData = {
  tables: SnookerTable[];
  bookings: Booking[];
};
