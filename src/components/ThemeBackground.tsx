import React from "react";
import { View, StyleSheet } from "react-native";
import { Theme } from "../theme/weatherTheme";

export default function ThemeBackground({ theme }: { theme: Theme }) {
    if (!theme.decorations?.length) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
            {theme.decorations.map((d, idx) => {
                const common: any = {
                    position: "absolute",
                    backgroundColor: theme.accent,
                    opacity: d.opacity ?? 0.12,
                };

                if (d.type === "circle") {
                    return (
                        <View
                            key={idx}
                            style={[
                                common,
                                {
                                    width: d.size,
                                    height: d.size,
                                    borderRadius: 999,
                                    top: d.top,
                                    bottom: d.bottom,
                                    left: d.left,
                                    right: d.right,
                                },
                            ]}
                        />
                    );
                }

                return (
                    <View
                        key={idx}
                        style={[
                            common,
                            {
                                width: d.width,
                                height: d.height,
                                borderRadius: 999,
                                top: d.top,
                                bottom: d.bottom,
                                left: d.left,
                                right: d.right,
                                transform: [{ rotate: `${d.rotateDeg ?? 0}deg` }],
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
}