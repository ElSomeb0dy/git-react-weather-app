import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
  // Layout
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", left: 12, zIndex: 10, padding: 4 },

  // Card
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.25)",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Status pill
  statusPill: {
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillError: { backgroundColor: "rgba(220,38,38,0.12)" },
  statusPillSuccess: { backgroundColor: "rgba(22,163,74,0.12)" },
  statusText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  statusTextError: { color: "#DC2626" },
  statusTextSuccess: { color: "#16A34A" },
});
