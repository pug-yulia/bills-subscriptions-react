import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { HomeScreen } from "../screens/HomeScreen";
import { BillsScreen } from "../screens/BillsScreen";
import { SubscriptionsScreen } from "../screens/SubscriptionsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AddPaymentScreen } from "../screens/AddPaymentScreen";

const Tab = createBottomTabNavigator();

function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.plusWrap}
    >
      <View style={styles.plusBtn}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: { height: 70, paddingBottom: 10 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Bills"
        component={BillsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />

      {/* ВАЖНО: AddPayment — отдельный экран в табах, но кнопка таба — "плюс" */}
      <Tab.Screen
        name="AddPayment"
        component={AddPaymentScreen}
        options={({ navigation }) => ({
          tabBarLabel: "",
          tabBarIcon: () => null,
          tabBarButton: () => (
            <PlusButton
              onPress={() => {
                // КЛЮЧ: не подмешивать старые params (иначе залипает id)
                navigation.navigate({
                  name: "AddPayment",
                  params: {}, // create
                  merge: false, // ВАЖНО
                });
              }}
            />
          ),
        })}
      />

      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  plusWrap: {
    position: "relative",
    top: -18,
    alignItems: "center",
    justifyContent: "center",
    width: 70,
  },
  plusBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1f4bff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
});
