import React, { useCallback, useMemo, useState } from "react";
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
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { getAllCategories } from "../repo/categoryRepository";
import {
  getAllCurrencies,
  getBaseCurrencyCode,
  Currency,
} from "../repo/currencyRepository";
import {
  insertPaymentEntry,
  updatePaymentEntry,
  getPaymentEntryById,
} from "../repo/paymentEntryRepository";

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

function dateOnlyFromIso(iso: string): string {
  return dateOnlyFromDate(new Date(iso));
}

function toMinorUnits(amountStr: string, minorUnit: number): number | null {
  const s = amountStr.replace(",", ".").trim();
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * Math.pow(10, minorUnit));
}

function fromMinorUnits(amountMinor: number, minorUnit: number): string {
  const factor = Math.pow(10, minorUnit);
  return (amountMinor / factor).toFixed(minorUnit);
}

function formatDateForDisplay(dateOnly: string) {
  const d = new Date(dateOnly);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ================= screen ================= */

export function AddPaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // КЛЮЧ: читаем только id (а не весь params-объект)
  const editId: string | undefined = route.params?.id;
  const isEdit = Boolean(editId);

  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const currencyMap = useMemo(
    () => new Map(currencies.map((c) => [c.code, c])),
    [currencies],
  );

  const [originalEntry, setOriginalEntry] = useState<PaymentEntry | null>(null);

  /* ---------- form state ---------- */

  const [type, setType] = useState<PaymentType>("bill");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [categoryId, setCategoryId] = useState("");

  const [dueDate, setDueDate] = useState<string>(todayDateOnly());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [repeatRule, setRepeatRule] = useState<RepeatRule>("monthly");
  const [note, setNote] = useState("");

  const resetForm = useCallback((base: string | null, cats: Category[]) => {
    setOriginalEntry(null);
    setType("bill");
    setTitle("");
    setAmount("");
    setCurrencyCode(base || "USD");
    setCategoryId(cats[0]?.id ?? "");
    setDueDate(todayDateOnly());
    setRepeatRule("monthly");
    setNote("");
  }, []);

  const loadScreenData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, currs, base] = await Promise.all([
        getAllCategories(),
        getAllCurrencies(),
        getBaseCurrencyCode(),
      ]);

      setCategories(cats);
      setCurrencies(currs);

      // CREATE: если нет id — просто сброс формы
      // ВАЖНО: НЕ делаем здесь navigation.setParams(), чтобы не ловить цикл.
      if (!editId) {
        resetForm(base, cats);
        return;
      }

      // EDIT: грузим запись
      const entry = await getPaymentEntryById(editId);
      if (!entry) {
        Alert.alert("Ошибка", "Запись для редактирования не найдена");
        navigation.navigate("Home");
        return;
      }

      setOriginalEntry(entry);

      setType(entry.type);
      setTitle(entry.title);
      setCurrencyCode(entry.currencyCode);
      setCategoryId(entry.categoryId);
      setDueDate(dateOnlyFromIso(entry.dueDate));
      setRepeatRule((entry.repeatRule as RepeatRule) ?? "monthly");
      setNote(entry.note ?? "");

      const cur = new Map(currs.map((c) => [c.code, c])).get(
        entry.currencyCode,
      );
      const mu = cur?.minorUnit ?? 2;
      setAmount(fromMinorUnits(entry.amount, mu));
    } catch (e: any) {
      console.error("AddPaymentScreen load error:", e);
      Alert.alert("Ошибка", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [editId, navigation, resetForm]);

  // КЛЮЧ: грузим на каждый фокус, чтобы после Edit → "+" форма была чистой
  useFocusEffect(
    useCallback(() => {
      loadScreenData();
    }, [loadScreenData]),
  );

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

    try {
      if (isEdit) {
        if (!originalEntry) {
          Alert.alert("Ошибка", "Нет данных редактируемой записи");
          return;
        }

        const updated: PaymentEntry = {
          ...originalEntry,
          title: title.trim(),
          amount: amountMinor,
          currencyCode,
          type,
          categoryId,
          dueDate: isoFromDateOnly(dueDate),
          repeatRule: type === "subscription" ? repeatRule : null,
          note: note.trim() || null,
          updatedAt: now,
        };

        await updatePaymentEntry(updated);

        // После сохранения: обязательно перейти на Home
        // (Плюсик уже открывает create через merge:false)
        navigation.navigate("Home");
        return;
      }

      const created: PaymentEntry = {
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

      await insertPaymentEntry(created);
      navigation.navigate("Home");
    } catch (e: any) {
      console.error("save error:", e);
      Alert.alert("Ошибка", String(e?.message ?? e));
    }
  }

  function onPickDate(_event: any, selected?: Date) {
    setShowDatePicker(false);
    if (selected) {
      setDueDate(dateOnlyFromDate(selected));
    }
  }

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
        <Text style={styles.headerTitle}>
          {isEdit ? "Edit Payment" : "Add New Payment"}
        </Text>
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
        <Text style={styles.label}>Type</Text>
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
                {t === "bill" ? "Bill" : "Subscription"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          style={styles.input}
        />

        <Text style={styles.label}>Currency</Text>
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

        <Text style={styles.label}>Category</Text>
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

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={[styles.input, styles.dateInput]}
          activeOpacity={0.85}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: "#111", fontWeight: "700" }}>
            {formatDateForDisplay(dueDate)}
          </Text>

          <Ionicons name="calendar-outline" size={18} color="#666" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(dueDate)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onPickDate}
          />
        )}

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

        <Text style={styles.label}>Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.saveText}>Save</Text>
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
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  iconBtn: { padding: 6 },

  content: { padding: 16, paddingBottom: 32 },

  label: { marginTop: 14, marginBottom: 6, fontWeight: "800", color: "#111" },

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
