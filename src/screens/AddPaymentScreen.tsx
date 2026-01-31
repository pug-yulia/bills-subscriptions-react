import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { getAllCategories } from "../repo/categoryRepository";
import {
  getAllCurrencies,
  getBaseCurrencyCode,
  Currency,
} from "../repo/currencyRepository";
import { insertPaymentEntry } from "../repo/paymentEntryRepository";

import { Category } from "../domain/Category";
import { PaymentEntry, PaymentType, RepeatRule } from "../domain/PaymentEntry";

/* ================= helpers ================= */

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function dateOnlyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function todayDateOnly(): string {
  return dateOnlyFromDate(new Date());
}

function isoFromDateOnly(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d).toISOString();
}

function toMinorUnits(amountStr: string, minorUnit: number): number | null {
  const s = amountStr.replace(",", ".").trim();
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * Math.pow(10, minorUnit));
}

/* ================= screen ================= */

export function AddPaymentScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const currencyMap = useMemo(
    () => new Map(currencies.map((c) => [c.code, c])),
    [currencies],
  );

  /* ---------- form state ---------- */

  const [type, setType] = useState<PaymentType>("bill");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [categoryId, setCategoryId] = useState("");

  // дата хранится как YYYY-MM-DD (удобно и для отображения, и для конвертации)
  const [dueDate, setDueDate] = useState<string>(todayDateOnly());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [repeatRule, setRepeatRule] = useState<RepeatRule>("monthly");
  const [note, setNote] = useState("");

  /* ---------- load data ---------- */

  useEffect(() => {
    (async () => {
      try {
        const [cats, currs, base] = await Promise.all([
          getAllCategories(),
          getAllCurrencies(),
          getBaseCurrencyCode(),
        ]);

        setCategories(cats);
        setCurrencies(currs);
        setCurrencyCode(base || "USD");
        setCategoryId(cats[0]?.id ?? "");
      } catch (e: any) {
        console.error("AddPaymentScreen load error:", e);
        Alert.alert("Ошибка", String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- save ---------- */

  async function onSave() {
    if (!title.trim()) {
      Alert.alert("Ошибка", "Введите название платежа");
      return;
    }
    if (!categoryId) {
      Alert.alert("Ошибка", "Выберите категорию");
      return;
    }

    const cur = currencyMap.get(currencyCode);
    const minorUnit = cur?.minorUnit ?? 2;
    const amountMinor = toMinorUnits(amount, minorUnit);

    if (amountMinor === null) {
      Alert.alert("Ошибка", "Введите корректную сумму (например 1.80)");
      return;
    }

    const now = nowIso();

    const entry: PaymentEntry = {
      id: makeId(),
      title: title.trim(),
      amount: amountMinor,
      currencyCode,
      type,
      categoryId,
      dueDate: isoFromDateOnly(dueDate),
      repeatRule: type === "subscription" ? repeatRule : null,
      note: note.trim() || null,
      isPaid: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await insertPaymentEntry(entry);
      navigation.navigate("Home");
    } catch (e: any) {
      console.error("insertPaymentEntry error:", e);
      Alert.alert("Ошибка", String(e?.message ?? e));
    }
  }

  /* ---------- date picker handler ---------- */

  function onPickDate(_event: any, selected?: Date) {
    // Android вызывает onChange и при отмене, и при выборе
    setShowDatePicker(false);
    if (selected) {
      setDueDate(dateOnlyFromDate(selected));
    }
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: "#666" }}>Загрузка…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Добавить</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={styles.iconBtn}
        >
          <Ionicons name="close" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type */}
        <Text style={styles.label}>Тип</Text>
        <View style={styles.row}>
          {(["bill", "subscription"] as PaymentType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[styles.chip, type === t && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.chipText, type === t && styles.chipTextActive]}
              >
                {t === "bill" ? "Счёт" : "Подписка"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.label}>Название</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Например: Электроэнергия"
          style={styles.input}
        />

        {/* Amount */}
        <Text style={styles.label}>Сумма</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Например: 1.80"
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          style={styles.input}
        />
        <Text style={styles.hint}>
          Ввод в основной единице (RUB/USD), сохраняем в minor units по
          minorUnit валюты.
        </Text>

        {/* Currency */}
        <Text style={styles.label}>Валюта</Text>
        <View style={styles.rowWrap}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c.code}
              onPress={() => setCurrencyCode(c.code)}
              style={[
                styles.chip,
                currencyCode === c.code && styles.chipActive,
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.chipText,
                  currencyCode === c.code && styles.chipTextActive,
                ]}
              >
                {c.symbol} {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={styles.label}>Категория</Text>
        <View style={styles.rowWrap}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.chipText,
                  categoryId === c.id && styles.chipTextActive,
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={styles.label}>Дата</Text>
        <TouchableOpacity
          style={[styles.input, styles.dateInput]}
          activeOpacity={0.85}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: "#111", fontWeight: "700" }}>{dueDate}</Text>
          <Ionicons name="calendar-outline" size={18} color="#666" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(dueDate)}
            mode="date"
            display="default"
            onChange={onPickDate}
          />
        )}

        {/* Repeat */}
        {type === "subscription" && (
          <>
            <Text style={styles.label}>Повтор</Text>
            <View style={styles.rowWrap}>
              {(["daily", "weekly", "monthly", "yearly"] as RepeatRule[]).map(
                (r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRepeatRule(r)}
                    style={[styles.chip, repeatRule === r && styles.chipActive]}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        repeatRule === r && styles.chipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </>
        )}

        {/* Note */}
        <Text style={styles.label}>Заметка</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Необязательно"
          multiline
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.saveText}>Сохранить</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= styles ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111" },
  iconBtn: { padding: 6 },

  content: { padding: 16, paddingBottom: 32 },

  label: { marginTop: 14, marginBottom: 6, fontWeight: "800", color: "#111" },
  hint: { marginTop: 6, fontSize: 11, color: "#777", lineHeight: 15 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#fff",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  row: { flexDirection: "row", gap: 10 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  chip: {
    borderWidth: 1,
    borderColor: "#1f4bff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: "#1f4bff" },
  chipText: { color: "#1f4bff", fontWeight: "800" },
  chipTextActive: { color: "#fff" },

  saveBtn: {
    marginTop: 24,
    backgroundColor: "#1f4bff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  saveText: { color: "#fff", fontWeight: "900" },
});
