// Mock expo-constants (API reads from Constants.expoConfig.extra)
jest.mock("expo-constants", () => ({
    expoConfig: { extra: { OPENWEATHER_API_KEY: "test-key" } },
}));

jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock("@react-native-sync-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-reanimated", () =>
    require("react-native-reanimated/mock")
);

jest.mock("react-native-gesture-handler", () => ({
    GestureHandlerRootView: ({ children }: any) => children,
    Swipeable: "Swipeable",
    DrawerLayout: "DrawerLayout",
    State: {},
    PanGestureHandler: "PanGestureHandler",
    BaseButton: "BaseButton",
    RectButton: "RectButton",
    BorderlessButton: "BorderlessButton",
    FlatList: require("react-native").FlatList,
    ScrollView: require("react-native").ScrollView,
    Directions: {},
}));

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
    const React = require("react");
    const { View } = require("react-native");
    const ReanimatedSwipeable = React.forwardRef(
        (props: any, _ref: any) =>
            React.createElement(View, null, props.renderRightActions?.(), props.children)
    );
    ReanimatedSwipeable.displayName = "ReanimatedSwipeable";
    return { __esModule: true, default: ReanimatedSwipeable, SwipeableMethods: {} };
});