import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { getAllPaymentEntries } from "../repo/paymentEntryRepository";
import { getAllCategories } from "../repo/categoryRepository";
import {
  getAllCurrencies,
  getAllFxRates,
  getBaseCurrencyCode,
  Currency,
  FxRate,
} from "../repo/currencyRepository";

import { PaymentEntry } from "../domain/PaymentEntry";
import { Category } from "../domain/Category";

import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import {
  deletePaymentEntry,
  setPaymentEntryPaidStatus,
} from "../repo/paymentEntryRepository";

/* ================= helpers ================= */

function formatAmount(amountMinor: number, currency: Currency): string {
  const factor = Math.pow(10, currency.minorUnit);
  const value = amountMinor / factor;
  return `${currency.symbol}${value.toFixed(currency.minorUnit)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function isInThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

function isInNext30Days(iso: string): boolean {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const in30 = now + 30 * 24 * 60 * 60 * 1000;
  return d >= now && d <= in30;
}

function nowIso(): string {
  return new Date().toISOString();
}

/* ================= screen ================= */

type DateFilter = "all" | "thisMonth" | "next30";
type SortOrder = "asc" | "desc";

export function SubscriptionsScreen() {
  const navigation = useNavigation<any>();

  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fxRates, setFxRates] = useState<FxRate[]>([]);
  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string>("USD");
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const currencyMap = useMemo(
    () => new Map(currencies.map((c) => [c.code, c])),
    [currencies],
  );

  const rateMap = useMemo(() => {
    const m = new Map<string, number>();
    fxRates.forEach((r) => m.set(`${r.baseCode}->${r.quoteCode}`, r.rate));
    return m;
  }, [fxRates]);

  function getRate(from: string, to: string): number | null {
    if (from === to) return 1;

    const direct = rateMap.get(`${from}->${to}`);
    if (direct != null) return direct;

    const inverse = rateMap.get(`${to}->${from}`);
    if (inverse != null && inverse !== 0) return 1 / inverse;

    return null;
  }

  function convertMinor(amountMinor: number, from: string, to: string): number {
    const r = getRate(from, to);
    if (r == null) return amountMinor;
    return Math.round(amountMinor * r);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ents, cats, currs, rates, base] = await Promise.all([
        getAllPaymentEntries(),
        getAllCategories(),
        getAllCurrencies(),
        getAllFxRates(),
        getBaseCurrencyCode(),
      ]);
      // берём только подписки
      setEntries(ents.filter((e) => e.type === "subscription"));
      setCategories(cats);
      setCurrencies(currs);
      setFxRates(rates);
      setBaseCurrencyCode(base);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  /* ---------- filtering + sorting ---------- */

  const filteredSorted = useMemo(() => {
    let data = [...entries];

    if (dateFilter === "thisMonth") {
      data = data.filter((e) => isInThisMonth(e.dueDate));
    } else if (dateFilter === "next30") {
      data = data.filter((e) => isInNext30Days(e.dueDate));
    }

    data.sort((a, b) => {
      const da = new Date(a.dueDate).getTime();
      const db = new Date(b.dueDate).getTime();
      return sortOrder === "asc" ? da - db : db - da;
    });

    return data;
  }, [entries, dateFilter, sortOrder]);

  /* ---------- CRUD handlers ---------- */

  const onTogglePaid = useCallback(
    async (entry: PaymentEntry) => {
      try {
        await setPaymentEntryPaidStatus(entry.id, !entry.isPaid, nowIso());
        await loadData();
      } catch (e: any) {
        console.error("toggle paid error:", e);
        Alert.alert("Error", String(e?.message ?? e));
      }
    },
    [loadData],
  );

  const onDelete = useCallback(
    (entry: PaymentEntry) => {
      Alert.alert(
        "Delete entry?",
        `"${entry.title}" will be permanently deleted.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deletePaymentEntry(entry.id);
                await loadData();
              } catch (e: any) {
                console.error("deletePaymentEntry error:", e);
                Alert.alert("Error", String(e?.message ?? e));
              }
            },
          },
        ],
      );
    },
    [loadData],
  );

  /* ---------- UI ---------- */

  function renderItem({ item }: { item: PaymentEntry }) {
    const cat = categoryMap.get(item.categoryId);
    const cur = currencyMap.get(baseCurrencyCode);

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, item.isPaid && styles.paidTitle]}>
            {item.title}
          </Text>
          <Text style={styles.meta}>
            {cat?.name ?? "—"} · {item.repeatRule ?? "—"} ·{" "}
            {formatDate(item.dueDate)}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, item.isPaid && styles.paidAmount]}>
            {cur
              ? formatAmount(
                  convertMinor(item.amount, item.currencyCode, baseCurrencyCode),
                  cur,
                )
              : "—"}
          </Text>

          <View style={styles.actions}>
            {/* Paid toggle */}
            <TouchableOpacity
              onPress={() => onTogglePaid(item)}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons
                name={
                  item.isPaid ? "checkmark-circle" : "checkmark-circle-outline"
                }
                size={20}
                color={item.isPaid ? "#19a35b" : "#666"}
              />
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              onPress={() => navigation.navigate("AddPayment", { id: item.id })}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil-outline" size={20} color="#1f4bff" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={() => onDelete(item)}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={20} color="#d11a2a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function filterChip(label: string, value: DateFilter) {
    const active = dateFilter === value;
    return (
      <TouchableOpacity
        onPress={() => setDateFilter(value)}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>

        <TouchableOpacity
          onPress={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
        >
          <Ionicons
            name={sortOrder === "asc" ? "arrow-down" : "arrow-up"}
            size={20}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filterChip("All", "all")}
        {filterChip("This month", "thisMonth")}
        {filterChip("Next 30 days", "next30")}
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={{ color: "#666" }}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSorted}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#777" }}>
                No subscriptions match the selected filter
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ================= styles ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },

  filters: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  chip: {
    borderWidth: 1,
    borderColor: "#1f4bff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: "#1f4bff" },
  chipText: { color: "#1f4bff", fontWeight: "700", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  title: { fontWeight: "700" },
  meta: { fontSize: 12, color: "#777" },
  amount: { fontWeight: "800" },

  sep: { height: 1, backgroundColor: "#eee", marginHorizontal: 16 },

  center: { padding: 24, alignItems: "center" },

  paidTitle: {
    color: "#777",
    textDecorationLine: "line-through",
  },

  right: {
    alignItems: "flex-end",
    gap: 6,
  },

  paidAmount: {
    color: "#777",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconBtn: {
    padding: 4,
  },
});
