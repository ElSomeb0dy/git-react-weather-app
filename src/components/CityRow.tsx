import React, { useRef } from "react";
import { Pressable, Text, View, StyleSheet, Image } from "react-native";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CurrentWeather } from "../types/weather";
import { tempColor } from "../utils/tempColor";
import { formatTemp, weatherIconUrl } from "../utils/format";
import { useLocalTime } from "../utils/useLocalTime";

type Props = {
    city: string;
    weather?: CurrentWeather;
    unit: "C" | "F";
    cardColor: string;
    textColor: string;
    subtleTextColor: string;
    onOpen: () => void;
    onRemove: () => void;
};

export default function CityRow({ city, weather, unit, cardColor, textColor, subtleTextColor, onOpen, onRemove }: Props) {
    const swipeableRef = useRef<SwipeableMethods>(null);
    const temp = weather ? formatTemp(weather.tempC, weather.tempF, unit) : null;
    const localTime = useLocalTime(weather?.timezone);

    const renderRightActions = () => (
        <Pressable
            testID="remove-city"
            style={styles.deleteAction}
            onPress={() => {
                swipeableRef.current?.close();
                onRemove();
            }}
        >
            <Text style={styles.deleteText}>Remove</Text>
        </Pressable>
    );

    return (
        <GestureHandlerRootView>
            <ReanimatedSwipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
                <Pressable testID="city-row" style={[styles.card, { backgroundColor: cardColor }]} onPress={onOpen}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {weather?.icon && (
                            <Image
                                source={{ uri: weatherIconUrl(weather.icon) }}
                                style={styles.icon}
                            />
                        )}
                        <View>
                            <Text style={[styles.city, { color: textColor }]}>
                                {weather ? `${weather.city}, ${weather.country}` : city}
                            </Text>
                            {localTime ? (
                                <Text style={[styles.localTime, { color: subtleTextColor }]}>{localTime}</Text>
                            ) : null}
                        </View>
                    </View>
                    {temp && <Text style={[styles.temp, { color: weather ? tempColor(weather.tempC) : textColor }]}>{temp}</Text>}
                </Pressable>
            </ReanimatedSwipeable>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(128,128,128,0.25)" },
    icon: { width: 36, height: 36 },
    city: { fontSize: 18, fontWeight: "800" },
    localTime: { fontSize: 12, fontWeight: "500", marginTop: 2, opacity: 0.7 },
    temp: { fontSize: 22, fontWeight: "800" },
    deleteAction: {
        backgroundColor: "#EF4444",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        borderRadius: 16,
        marginLeft: 8,
    },
    deleteText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
