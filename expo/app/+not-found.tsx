import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { GameColors } from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost in the Void" }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🐉</Text>
        <Text style={styles.title}>Xiao Long can't find this path!</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Dragon Dash</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: GameColors.darkBg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: GameColors.ui.white,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GameColors.ui.neonCyan,
  },
  linkText: {
    fontSize: 14,
    color: GameColors.ui.neonCyan,
    fontWeight: "600",
  },
});
