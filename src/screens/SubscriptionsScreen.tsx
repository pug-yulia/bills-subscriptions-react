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
import { getAllCurrencies, Currency } from "../repo/currencyRepository";

import { PaymentEntry } from "../domain/PaymentEntry";
import { Category } from "../domain/Category";

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

/* ================= screen ================= */

type DateFilter = "all" | "thisMonth" | "next30";
type SortOrder = "asc" | "desc";

export function SubscriptionsScreen() {
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ents, cats, currs] = await Promise.all([
        getAllPaymentEntries(),
        getAllCategories(),
        getAllCurrencies(),
      ]);
      // берём только подписки
      setEntries(ents.filter((e) => e.type === "subscription"));
      setCategories(cats);
      setCurrencies(currs);
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

  /* ---------- UI ---------- */

  function renderItem({ item }: { item: PaymentEntry }) {
    const cat = categoryMap.get(item.categoryId);
    const cur = currencyMap.get(item.currencyCode);

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {cat?.name ?? "—"} · {item.repeatRule ?? "—"} ·{" "}
            {formatDate(item.dueDate)}
          </Text>
        </View>

        {cur ? (
          <Text style={styles.amount}>{formatAmount(item.amount, cur)}</Text>
        ) : (
          <Text style={styles.amount}>—</Text>
        )}
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
          <Text style={{ color: "#666" }}>Загрузка…</Text>
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
                Нет подписок по выбранному фильтру
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
});
