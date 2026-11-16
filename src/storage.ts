import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "./types";

const KEY = "snooker-house-data-v1";

export const initialData: AppData = {
  tables: [
    { id: "T1", label: "Table 01", rate: 5, status: "available" },
    { id: "T2", label: "Table 02", rate: 4, status: "available" },
    { id: "T3", label: "Table 03", rate: 4, status: "available" }
  ],
  bookings: []
};

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as AppData : initialData;
  } catch {
    return initialData;
  }
}

export async function saveData(data: AppData) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
