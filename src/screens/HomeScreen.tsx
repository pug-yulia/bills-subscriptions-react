import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { initDb, resetAndInitDb, resetDb } from "../db/database";
import {
  seedCurrenciesAndRates,
  seedCategories,
  seedPaymentEntries,
} from "../db/seed";

import {
  getCategoriesCount,
  getAllCategories,
} from "../repo/categoryRepository";
import {
  getPaymentEntriesCount,
  getAllPaymentEntries,
} from "../repo/paymentEntryRepository";

import {
  getAllCurrencies,
  getAllFxRates,
  getBaseCurrencyCode,
  Currency,
  FxRate,
} from "../repo/currencyRepository";

import { Category } from "../domain/Category";
import { PaymentEntry } from "../domain/PaymentEntry";
import { useFocusEffect } from "@react-navigation/native";

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  // const [search, setSearch] = useState("");

  const [baseCurrencyCode, setBaseCurrencyCode] = useState<string>("USD");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fxRates, setFxRates] = useState<FxRate[]>([]);

  const loadHomeData = useCallback(async () => {
    const [cats, ents, currs, rates, base] = await Promise.all([
      getAllCategories(),
      getAllPaymentEntries(),
      getAllCurrencies(),
      getAllFxRates(),
      getBaseCurrencyCode(),
    ]);

    setCategories(cats);
    setEntries(ents);
    setCurrencies(currs);
    setFxRates(rates);
    setBaseCurrencyCode(base);
  }, []);
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        await loadHomeData();
      } catch (e: any) {
        console.error("HomeScreen load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadHomeData]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await loadHomeData();
        } catch (e) {
          console.error("HomeScreen focus reload error:", e);
        }
      })();
    }, [loadHomeData]),
  );

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const currencyMap = useMemo(() => {
    const m = new Map<string, Currency>();
    currencies.forEach((c) => m.set(c.code, c));
    return m;
  }, [currencies]);

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
    if (r == null) {
      // Мягкий fallback, чтобы UI не падал. Для строгого режима можно throw.
      return amountMinor;
    }
    return Math.round(amountMinor * r);
  }

  function formatMoneyMinor(amountMinor: number, currencyCode: string) {
    const cur = currencyMap.get(currencyCode);
    const symbol = cur?.symbol ?? currencyCode;
    const minorUnit = cur?.minorUnit ?? 2;

    const value = (amountMinor / Math.pow(10, minorUnit)).toFixed(minorUnit);

    // простой формат: символ слева (для диплома норм)
    return `${symbol}${value}`;
  }

  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning ☀️";
    if (hour < 18) return "afternoon 🌤️";
    return "evening 🌙";
  }

  /**const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.trim().toLowerCase();
    return entries.filter((e) => e.title.toLowerCase().includes(q));
  }, [entries, search]);**/

  const totalThisMonthBase = useMemo(() => {
    const now = new Date();
    const key = monthKey(now);

    let sum = 0;
    for (const e of entries) {
      const d = new Date(e.dueDate);
      if (monthKey(d) !== key) continue;
      sum += convertMinor(e.amount, e.currencyCode, baseCurrencyCode);
    }
    return sum;
    // важно: rateMap/currencyMap влияют на конвертацию и форматирование
  }, [entries, baseCurrencyCode, rateMap]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return entries
      .filter(
        (e) =>
          e.type === "bill" && new Date(e.dueDate).getTime() >= today.getTime(),
      )
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )
      .slice(0, 4);
  }, [entries]);

  const activeSubscriptions = useMemo(() => {
    return entries
      .filter((e) => e.type === "subscription")
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 3);
  }, [entries]);

  /**const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return filteredEntries
      .filter(
        (e) =>
          e.type === "bill" && new Date(e.dueDate).getTime() >= today.getTime(),
      )
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 3);
  }, [filteredEntries]);

  const activeSubscriptions = useMemo(() => {
    return filteredEntries
      .filter((e) => e.type === "subscription")
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 3);
  }, [filteredEntries]);**/

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {/* Шапку Welcome back + колокольчик убрали */}

        {/*<View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#8aa0ff" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search bills or subscriptions..."
            placeholderTextColor="#8aa0ff"
            style={styles.searchInput}
          />
        </View>*/}

        <Text style={styles.headerSubtitle}>Good {getTimeOfDay()},</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total This Month</Text>
          <Text style={styles.cardValue}>
            {loading
              ? "—"
              : formatMoneyMinor(totalThisMonthBase, baseCurrencyCode)}
          </Text>

          <View style={styles.cardBottom}>
            <Text style={styles.cardBottomLabel}>Upcoming Bills</Text>
            <Text style={styles.cardBottomValue}>
              {loading
                ? "—"
                : formatMoneyMinor(totalThisMonthBase, baseCurrencyCode)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <SectionHeader
          title="Upcoming Bills"
          onPress={() => navigation.navigate("Bills")}
        />
        <FlatList
          data={upcomingBills}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RowItem
              title={item.title}
              subtitle={
                categoryMap.get(item.categoryId)?.name ?? item.categoryId
              }
              right={
                loading
                  ? "—"
                  : formatMoneyMinor(
                      convertMinor(
                        item.amount,
                        item.currencyCode,
                        baseCurrencyCode,
                      ),
                      baseCurrencyCode,
                    )
              }
              icon="flash-outline"
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Нет ближайших счетов</Text>
          }
        />

        <View style={{ height: 18 }} />

        <SectionHeader
          title="Active Subscriptions"
          onPress={() => navigation.navigate("Subscriptions")}
        />

        <FlatList
          data={activeSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RowItem
              title={item.title}
              subtitle={(item.repeatRule ?? "monthly").toString()}
              right={
                loading
                  ? "—"
                  : `${formatMoneyMinor(
                      convertMinor(
                        item.amount,
                        item.currencyCode,
                        baseCurrencyCode,
                      ),
                      baseCurrencyCode,
                    )} /${item.repeatRule ?? "month"}`
              }
              icon="grid-outline"
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={<Text style={styles.empty}>Нет подписок</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
  );
}

function RowItem({
  title,
  subtitle,
  right,
  icon,
}: {
  title: string;
  subtitle: string;
  right: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color="#1f4bff" />
        </View>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.rowRight}>{right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#1f4bff",
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  searchWrap: {
    backgroundColor: "#2c5cff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#fff",
    fontSize: 14,
  },

  card: {
    marginTop: 0,
    backgroundColor: "#1941df",
    borderRadius: 22,
    padding: 20,
  },

  cardTitle: { color: "#cfd8ff", fontSize: 12 },
  cardValue: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 6 },
  cardBottom: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardBottomLabel: { color: "#cfd8ff", fontSize: 12 },
  cardBottomValue: { color: "#fff", fontSize: 12, fontWeight: "700" },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0d0d0d" },
  seeAll: { fontSize: 12, color: "#1f4bff", fontWeight: "600" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  rowSubtitle: { fontSize: 12, color: "#8b8b8b", marginTop: 2 },
  rowRight: { fontSize: 13, fontWeight: "700", color: "#111" },

  sep: { height: 1, backgroundColor: "#f0f0f0" },
  empty: { color: "#777", paddingVertical: 10 },

  headerSubtitle: {
    color: "#cfd8ff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
});
