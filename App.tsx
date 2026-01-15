import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { initDb } from "./src/db/database";
import {
  getAllCategories,
  getCategoriesCount,
} from "./src/repo/categoryRepository";
import { seedCategories } from "./src/db/seed";
import { Category } from "./src/domain/Category";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDb();
        const count = await getCategoriesCount();
        if (count === 0) {
          await seedCategories();
        }
        const all = await getAllCategories();
        setCategories(all);
      } catch (e: any) {
        console.error("App bootstrap error:", e);
        setErrorText(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (errorText) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Ошибка</Text>
        <Text style={styles.errorText}>{errorText}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Категории</Text>
      <FlatList
        style={styles.list}
        data={categories}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: item.color ?? "#999" },
              ]}
            />
            <Text style={styles.rowText}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>Категорий нет</Text>}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  rowText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    color: "crimson",
  },
});
