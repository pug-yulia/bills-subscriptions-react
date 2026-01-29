import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Currency,
  getAllCurrencies,
  getBaseCurrencyCode,
  setBaseCurrencyCode,
} from "../repo/currencyRepository";

import { resetAndInitDb } from "../db/database";
import {
  seedCurrenciesAndRates,
  seedCategories,
  seedPaymentEntries,
} from "../db/seed";

type SectionItem =
  | { type: "header"; title: string; subtitle?: string }
  | { type: "currency"; currency: Currency; selected: boolean }
  | {
      type: "action";
      id: "resetDb";
      title: string;
      subtitle?: string;
      danger?: boolean;
    };

export function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [base, setBase] = useState<string>("USD");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, current] = await Promise.all([
        getAllCurrencies(),
        getBaseCurrencyCode(),
      ]);
      setCurrencies(all);
      setBase(current);
    } catch (e: any) {
      console.error("SettingsScreen load error:", e);
      Alert.alert("Ошибка", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSelectCurrency = useCallback(
    async (code: string) => {
      if (code === base) return;
      try {
        await setBaseCurrencyCode(code);
        setBase(code);
      } catch (e: any) {
        console.error("setBaseCurrencyCode error:", e);
        Alert.alert("Ошибка", String(e?.message ?? e));
      }
    },
    [base],
  );

  const onResetDb = useCallback(() => {
    Alert.alert(
      "Сброс базы данных",
      "Удалить локальную базу и заполнить демо-данными заново?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await resetAndInitDb();

              // порядок важен
              await seedCurrenciesAndRates();
              await seedCategories();
              await seedPaymentEntries();

              await load();

              Alert.alert(
                "Готово",
                "База данных успешно сброшена и заполнена демо-данными.",
              );
            } catch (e: any) {
              console.error("Reset DB error:", e);
              Alert.alert("Ошибка", String(e?.message ?? e));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }, [load]);

  const data: SectionItem[] = [
    {
      type: "header",
      title: "Валюта приложения",
      subtitle:
        "Суммы и итоги будут автоматически пересчитаны в выбранную валюту",
    },
    ...currencies.map((c) => ({
      type: "currency" as const,
      currency: c,
      selected: c.code === base,
    })),
    {
      type: "header",
      title: "Сервис",
      subtitle: "Служебные функции для разработки и тестирования",
    },
    {
      type: "action",
      id: "resetDb",
      title: "Сбросить базу данных",
      subtitle:
        "Удаляет локальные данные и пересоздаёт БД (полезно после изменения схемы)",
      danger: true,
    },
    {
      type: "header",
      title: "Прочее",
      subtitle: "Дополнительные настройки будут добавлены позже",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Загрузка…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={data}
          keyExtractor={(item, index) =>
            item.type === "currency"
              ? `cur-${item.currency.code}`
              : `${item.type}-${index}`
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.sectionSubtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
              );
            }

            if (item.type === "currency") {
              const c = item.currency;
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onSelectCurrency(c.code)}
                  style={styles.row}
                >
                  <View style={styles.rowLeft}>
                    <View style={styles.iconWrap}>
                      <Text style={styles.symbol}>{c.symbol}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>
                        {c.name} <Text style={styles.rowCode}>({c.code})</Text>
                      </Text>
                      <Text style={styles.rowSub}>
                        Minor unit: {c.minorUnit}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={
                      item.selected ? "radio-button-on" : "radio-button-off"
                    }
                    size={22}
                    color={item.selected ? "#1f4bff" : "#b8b8b8"}
                  />
                </TouchableOpacity>
              );
            }

            // action
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onResetDb}
                style={[
                  styles.actionRow,
                  item.danger ? styles.actionRowDanger : null,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.actionTitle,
                      item.danger ? styles.actionTitleDanger : null,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={item.danger ? "#d11a2a" : "#111"}
                />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  top: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111" },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#666" },

  list: { paddingHorizontal: 16, paddingBottom: 16 },

  section: { paddingTop: 14, paddingBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#111" },
  sectionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    lineHeight: 16,
  },

  row: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: { fontSize: 16, fontWeight: "800", color: "#1f4bff" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#111" },
  rowCode: { color: "#666", fontWeight: "700" },
  rowSub: { fontSize: 12, color: "#888", marginTop: 2 },

  actionRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#f6f7fb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  actionRowDanger: {
    backgroundColor: "#fff0f1",
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  actionTitleDanger: {
    color: "#d11a2a",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    lineHeight: 16,
  },

  sep: { height: 1, backgroundColor: "#f0f0f0" },
});
