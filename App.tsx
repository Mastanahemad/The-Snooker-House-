
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet
} from "react-native";

import {
  AppData,
  Booking,
  SnookerTable
} from "./src/types";

import {
  initialData,
  loadData,
  saveData
} from "./src/storage";

type ActiveSession = {
  startedAt: number;
  customer: string;
  phone: string;
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const getDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getStartTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function App() {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"home" | "history">("home");

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");

  const [active, setActive] = useState<Record<string, ActiveSession>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadData().then(saved => {
      setData(saved);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) {
      saveData(data);
    }
  }, [data, ready]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startGame = (table: SnookerTable) => {
    if (!customer.trim()) {
      Alert.alert("Customer Required", "Enter customer name first.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      Alert.alert("Invalid Mobile", "Enter a valid 10 digit mobile number.");
      return;
    }

    if (table.status === "maintenance") {
      Alert.alert("Unavailable", "This table is under maintenance.");
      return;
    }

    if (active[table.id]) {
      Alert.alert("Already Running", "This table is already occupied.");
      return;
    }

    setActive(prev => ({
      ...prev,
      [table.id]: {
        startedAt: Date.now(),
        customer: customer.trim(),
        phone: phone.trim()
      }
    }));

    setCustomer("");
    setPhone("");
  };

  const stopGame = (table: SnookerTable) => {
    const session = active[table.id];

    if (!session) return;

    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt) / 1000
    );

    const minutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const amount = minutes * table.rate;

    const booking: Booking = {
      id: `${Date.now()}`,
      customer: session.customer,
      phone: session.phone,
      tableId: table.id,
      date: getDate(),
      start: getStartTime(session.startedAt),
      hours: minutes / 60,
      amount,
      status: "confirmed"
    };

    setData(prev => ({
      ...prev,
      bookings: [booking, ...prev.bookings]
    }));

    setActive(prev => {
      const updated = { ...prev };
      delete updated[table.id];
      return updated;
    });

    Alert.alert(
      "Game Completed",
      `Customer: ${session.customer}\nTable: ${table.label}\nPlaying: ${minutes} minutes\nRate: ₹${table.rate}/minute\n\nTotal Bill: ₹${amount}`
    );
  };

  const toggleMaintenance = (table: SnookerTable) => {
    if (active[table.id]) {
      Alert.alert("Stop Game", "Stop the current game first.");
      return;
    }

    setData(prev => ({
      ...prev,
      tables: prev.tables.map(t =>
        t.id === table.id
          ? {
              ...t,
              status:
                t.status === "maintenance"
                  ? "available"
                  : "maintenance"
            }
          : t
      )
    }));
  };

  const revenue = data.bookings
    .filter(b => b.status === "confirmed")
    .reduce((sum, b) => sum + b.amount, 0);

  const todayRevenue = data.bookings
    .filter(b => b.date === getDate() && b.status === "confirmed")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalGames = data.bookings.length;

  const elapsed = (id: string) => {
    const session = active[id];
    if (!session) return 0;

    return Math.floor((now - session.startedAt) / 1000);
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading The Snooker House...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#101010" />

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.logo}>THE SNOOKER HOUSE</Text>
          <Text style={styles.subtitle}>Premium Snooker Club</Text>
        </View>

        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navButton, screen === "home" && styles.selected]}
            onPress={() => setScreen("home")}
          >
            <Text style={styles.navText}>HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, screen === "history" && styles.selected]}
            onPress={() => setScreen("history")}
          >
            <Text style={styles.navText}>BOOKINGS</Text>
          </TouchableOpacity>
        </View>

        {screen === "home" ? (
          <>
            <Text style={styles.heading}>Dashboard</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TODAY'S SALES</Text>
                <Text style={styles.statValue}>₹{todayRevenue}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL REVENUE</Text>
                <Text style={styles.statValue}>₹{revenue}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL GAMES</Text>
                <Text style={styles.statValue}>{totalGames}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ACTIVE TABLES</Text>
                <Text style={styles.statValue}>
                  {Object.keys(active).length}/3
                </Text>
              </View>
            </View>

            <Text style={styles.heading}>New Game</Text>

            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              placeholderTextColor="#888"
              value={customer}
              onChangeText={setCustomer}
            />

            <TextInput
              style={styles.input}
              placeholder="10 Digit Mobile Number"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.heading}>Snooker Tables</Text>

            {data.tables.map(table => {
              const session = active[table.id];
              const running = !!session;
              const seconds = elapsed(table.id);
              const minutes = Math.ceil(seconds / 60);
              const bill = minutes * table.rate;

              return (
                <View style={styles.tableCard} key={table.id}>

                  <View style={styles.tableHeader}>
                    <Text style={styles.tableName}>{table.label}</Text>

                    <Text style={[
                      styles.status,
                      {
                        color: table.status === "maintenance"
                          ? "#ff5555"
                          : running ? "#ffbd45" : "#42d68a"
                      }
                    ]}>
                      {table.status === "maintenance"
                        ? "MAINTENANCE"
                        : running ? "OCCUPIED" : "AVAILABLE"}
                    </Text>
                  </View>

                  <Text style={styles.rate}>
                    ₹{table.rate} / minute
                  </Text>

                  {running && (
                    <View style={styles.timerBox}>
                      <Text style={styles.timer}>
                        {formatTime(seconds)}
                      </Text>

                      <Text style={styles.bill}>
                        Playing: {minutes} min
                      </Text>

                      <Text style={styles.bill}>
                        Current Bill: ₹{bill}
                      </Text>

                      <Text style={styles.customerText}>
                        Customer: {session.customer}
                      </Text>
                    </View>
                  )}

                  <View style={styles.actions}>
                    {!running ? (
                      <TouchableOpacity
                        style={[
                          styles.startButton,
                          table.status === "maintenance" && styles.disabled
                        ]}
                        disabled={table.status === "maintenance"}
                        onPress={() => startGame(table)}
                      >
                        <Text style={styles.buttonText}>START GAME</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.stopButton}
                        onPress={() => stopGame(table)}
                      >
                        <Text style={styles.buttonText}>STOP & BILL</Text>
                      </TouchableOpacity>
                    )}

                    {!running && (
                      <TouchableOpacity
                        style={styles.maintenanceButton}
                        onPress={() => toggleMaintenance(table)}
                      >
                        <Text style={styles.buttonText}>
                          {table.status === "maintenance"
                            ? "ENABLE"
                            : "MAINTENANCE"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <>
            <Text style={styles.heading}>Booking History</Text>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL COLLECTION</Text>
              <Text style={styles.statValue}>₹{revenue}</Text>
            </View>

            {data.bookings.length === 0 ? (
              <Text style={styles.empty}>
                No bookings yet.
              </Text>
            ) : (
              data.bookings.map(booking => (
                <View style={styles.historyCard} key={booking.id}>
                  <Text style={styles.tableName}>
                    {booking.customer}
                  </Text>

                  <Text style={styles.historyText}>
                    Mobile: {booking.phone}
                  </Text>

                  <Text style={styles.historyText}>
                    Table: {booking.tableId}
                  </Text>

                  <Text style={styles.historyText}>
                    Date: {booking.date}
                  </Text>

                  <Text style={styles.historyText}>
                    Start: {booking.start}
                  </Text>

                  <Text style={styles.historyText}>
                    Playing Time: {Math.round(booking.hours * 60)} minutes
                  </Text>

                  <Text style={styles.historyAmount}>
                    Bill: ₹{booking.amount}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        <Text style={styles.footer}>
          THE SNOOKER HOUSE © 2026
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101010"
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  loading: {
    color: "#ffffff",
    textAlign: "center",
    marginTop: 100
  },
  header: {
    paddingVertical: 24,
    alignItems: "center"
  },
  logo: {
    color: "#d6ad60",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2
  },
  subtitle: {
    color: "#aaaaaa",
    marginTop: 6
  },
  nav: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 10
  },
  navButton: {
    flex: 1,
    padding: 14,
    backgroundColor: "#242424",
    borderRadius: 8,
    alignItems: "center"
  },
  selected: {
    backgroundColor: "#99733b"
  },
  navText: {
    color: "#ffffff",
    fontWeight: "bold"
  },
  heading: {
    color: "#d6ad60",
    fontSize: 21,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 14
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  statCard: {
    flex: 1,
    backgroundColor: "#202020",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10
  },
  statLabel: {
    color: "#999999",
    fontSize: 11
  },
  statValue: {
    color: "#d6ad60",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8
  },
  input: {
    backgroundColor: "#202020",
    borderColor: "#444444",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    color: "#ffffff",
    marginBottom: 12,
    fontSize: 15
  },
  tableCard: {
    backgroundColor: "#202020",
    borderRadius: 12,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#373737"
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  tableName: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "bold"
  },
  status: {
    fontSize: 11,
    fontWeight: "bold"
  },
  rate: {
    color: "#d6ad60",
    fontSize: 17,
    marginTop: 12
  },
  timerBox: {
    backgroundColor: "#151515",
    padding: 15,
    borderRadius: 8,
    marginTop: 15
  },
  timer: {
    color: "#42d68a",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center"
  },
  bill: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center"
  },
  customerText: {
    color: "#aaaaaa",
    textAlign: "center",
    marginTop: 8
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  startButton: {
    flex: 1,
    backgroundColor: "#168b54",
    padding: 14,
    borderRadius: 8,
    alignItems: "center"
  },
  stopButton: {
    flex: 1,
    backgroundColor: "#c53e3e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center"
  },
  maintenanceButton: {
    backgroundColor: "#555555",
    padding: 14,
    borderRadius: 8,
    alignItems: "center"
  },
  disabled: {
    opacity: 0.4
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 12
  },
  historyCard: {
    backgroundColor: "#202020",
    padding: 17,
    borderRadius: 10,
    marginBottom: 12
  },
  historyText: {
    color: "#bbbbbb",
    marginTop: 7
  },
  historyAmount: {
    color: "#42d68a",
    fontWeight: "bold",
    fontSize: 20,
    marginTop: 12
  },
  empty: {
    color: "#aaaaaa",
    textAlign: "center",
    marginTop: 40
  },
  footer: {
    color: "#666666",
    textAlign: "center",
    marginTop: 35,
    fontSize: 11
  }
});
