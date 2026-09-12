import { useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { fieldLogin, type FieldUser } from "../lib/auth";

interface Props {
  onLoggedIn: (user: FieldUser) => void;
}

export function LoginScreen({ onLoggedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    try {
      const user = await fieldLogin(email, password);
      onLoggedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SILAS Field</Text>
      <Text style={styles.subtitle}>Sign in to scan and sync assets</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="username"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {pending ? (
        <ActivityIndicator color="#9cf" style={styles.spinner} />
      ) : (
        <Button title="Sign in" onPress={() => void handleSubmit()} disabled={!email || !password} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#9cf",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#111",
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 8,
    color: "#fff",
    padding: 12,
    marginBottom: 12,
  },
  error: {
    color: "#f66",
    textAlign: "center",
    marginBottom: 12,
  },
  spinner: {
    marginTop: 8,
  },
});
