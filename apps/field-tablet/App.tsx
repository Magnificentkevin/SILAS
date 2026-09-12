import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ScannerScreen } from "./screens/scanner-screen";
import { HomeScreen } from "./screens/home-screen";
import { LoginScreen } from "./screens/login-screen";
import { getStoredUser, type FieldUser } from "./lib/auth";

type Route = "loading" | "login" | "home" | "scanner";

export default function App() {
  const [route, setRoute] = useState<Route>("loading");
  const [user, setUser] = useState<FieldUser | null>(null);

  useEffect(() => {
    void getStoredUser().then((stored) => {
      setUser(stored);
      setRoute(stored ? "home" : "login");
    });
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {route === "loading" ? <View style={styles.container} /> : null}
        {route === "login" ? (
          <LoginScreen
            onLoggedIn={(loggedInUser) => {
              setUser(loggedInUser);
              setRoute("home");
            }}
          />
        ) : null}
        {route === "home" && user ? (
          <HomeScreen
            user={user}
            onStartScanning={() => setRoute("scanner")}
            onSignedOut={() => {
              setUser(null);
              setRoute("login");
            }}
          />
        ) : null}
        {route === "scanner" && user ? (
          <ScannerScreen onBack={() => setRoute("home")} user={user} />
        ) : null}
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
