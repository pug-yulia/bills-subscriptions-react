import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { HomeScreen } from "../screens/HomeScreen";
import { BillsScreen } from "../screens/BillsScreen";
import { SubscriptionsScreen } from "../screens/SubscriptionsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AddPaymentScreen } from "../screens/AddPaymentScreen";

const Tab = createBottomTabNavigator();

function PlusButton() {
  return (
    <View style={styles.plusWrap}>
      <View style={styles.plusBtn}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </View>
  );
}
export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: Platform.OS === "ios" ? 86 : 70,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 10,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Bills"
        component={BillsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Центральная кнопка "+" (пока просто заглушка) */}
      <Tab.Screen
        name="Add"
        component={AddPaymentScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => <PlusButton />,
        }}
      />

      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  plusWrap: {
    width: 70,
    alignItems: "center",
  },
  plusBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1f4bff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
