# React Weather App — Project Documentation

A React Native weather app built with Expo. Users log in, save cities, and view real-time weather pulled from the OpenWeatherMap API.

## Features

### Authentication
- Email and password login via Supabase
- Account creation from the same screen
- Forgot password flow (sends reset email)
- Input validation before any network call (email format, minimum password length)
- Friendly error messages — "Incorrect email or password." instead of raw API errors
- After login, the back stack is cleared so users can't navigate back to the login screen
- Logout clears the session and resets navigation to Login

### Home Screen
- Time-based greeting — Good morning / afternoon / evening / night
- Current location weather card (uses device GPS)
  - City and country name
  - Large temperature display
  - Feels like, humidity, wind speed
- Saved cities list — each row shows:
  - Weather icon from OpenWeatherMap
  - City and country (consistent `City, Country` format)
  - Temperature in chosen unit, colour-coded by heat
- Swipe left on any city row to reveal a Remove button
- Search bar with live city suggestions (deduplicated by name and coordinates)
  - Typing a city name and pressing Add without selecting a suggestion defaults to the first match
- Inline feedback messages (success/error) that auto-dismiss after 3 seconds
- Settings gear icon in the top-right corner of the greeting row

### Weather Detail Screen
- Full-screen detail view for any saved city
- Stats displayed in a clean grid: Feels Like, Humidity, Wind, Min/Max temp, Pressure, Visibility, Sunrise, Sunset
- Back button for platforms that don't support swipe-back (web)
- Last updated timestamp

### Settings Screen
- Toggle between Celsius and Fahrenheit — persisted across sessions
- Logout button

### UI & Theming
- Weather-based colour themes — each condition (Clear, Rain, Snow, Clouds, Thunderstorm) has its own background, card, and accent colours
- Semi-transparent cards (glass effect via rgba) so the background gradient shows through
- Geometric background decorations (circles, lines) matching the weather theme
- Temperature colours — blue for freezing through red for hot
- Safe area aware on iOS, Android, and web (no overlap with status bar)
- No native headers — fully custom layout on every screen

### API & Data
- OpenWeatherMap API for weather data
- Both coordinate-based (current location) and city name-based lookups
- All fields parsed from the API: temp, feels like, min/max, humidity, wind, pressure, visibility, sunrise/sunset
- City weather fetches run in parallel (not sequentially) for faster load times
- API key loaded from environment variables via `expo-constants`

### SDK Compatibility
- Main branch targets Expo SDK 55
- `version-fix` branch targets Expo SDK 54 for use with the current Expo Go App Store release


## Bug Fixes & Improvements

| What was fixed | Details |
|---|---|
| Status bar overlap on iOS | Added `useSafeAreaInsets` with `paddingTop` on all screens |
| Inconsistent city names | Saved cities displayed raw DB strings; now always shows `weather.city, weather.country` from API |
| Weather description capitalisation | "broken clouds" → "Broken Clouds" |
| Android login crash | Fixed navigation reset after login on Android |
| Back button missing on web | Added chevron-back button on WeatherDetail and Settings screens |
| Unit change not reflected | Temperature unit now reloads when returning from Settings (via `useFocusEffect`) |
| Feedback messages stuck on screen | Success/error messages now auto-clear after 3 seconds |
| Duplicate city suggestions | Suggestions are deduplicated by both label and coordinates |
| Settings loaded twice on mount | Removed redundant `useEffect`, kept only `useFocusEffect` |
| Sequential city weather fetches | Changed `for` loop to `Promise.allSettled` — all cities fetch in parallel |
| Duplicate API response parsing | Extracted shared `parseWeatherData()` helper in `openWeather.ts` |


## Environment Variables

In a `.env` file in the project root:

OPENWEATHER_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

These are loaded via `expo-constants` and accessed as `Constants.expoConfig.extra.*`.


## Test Coverage

Tests live in `__tests__/`. Run with:
npm test                # run all tests
npm run test:coverage   # run with coverage report
npm run test:watch      # watch mode


### Test Suite

| File | What it tests | Value |
|---|---|---|
| `openWeather.test.ts` | API parsing, Kelvin conversion, error handling, city suggestion deduplication | High |
| `useWeather.test.tsx` | Loading/error state management, city change refetch | High |
| `LoginScreen.test.tsx` | Validation, login success/failure, signup, forgot password | High |
| `CityRow.test.tsx` | City display, unit switching, open/remove callbacks | High |
| `tempColor.test.ts` | All 6 temperature boundary conditions | High |
| `settings.test.ts` | Defaults, stored values, corrupt JSON recovery | High |
| `storage.test.ts` | City list, auth session, secure storage (native path) | High |
| `weatherTheme.test.ts` | Required fields on all themes, fallback behaviour | Medium |


## Code Structure

src/
├── components/
│   ├── CityRow.tsx          # Swipeable city row with icon, name, temperature
│   └── ThemeBackground.tsx  # Decorative geometric shapes (circles, lines)
├── hooks/
│   └── useWeather.ts        # Fetches weather for a city, manages loading/error state
├── navigation/
│   ├── RootNavigator.tsx    # Stack navigator (Login → Home → WeatherDetail / Settings)
│   └── types.ts             # Route param types
├── screens/
│   ├── HomeScreen.tsx       # Main screen — greeting, location card, saved cities
│   ├── LoginScreen.tsx      # Auth screen — login, signup, forgot password
│   ├── SettingsScreen.tsx   # Unit toggle and logout
│   ├── SplashScreen.tsx     # Initial loading screen
│   └── WeatherDetailScreen.tsx  # Full detail view for a city
├── services/
│   ├── openWeather.ts       # API calls — weather by city, by coords, city suggestions
│   └── supabase.ts          # Supabase client setup
├── storage/
│   ├── keys.ts              # Storage key constants
│   ├── secure.ts            # Platform-aware secure storage (SecureStore on native, AsyncStorage on web)
│   └── settings.ts          # AsyncStorage for user preferences (unit)
├── theme/
│   └── weatherTheme.ts      # Theme definitions per weather condition + `themeForCondition()`
├── types/
│   └── weather.ts           # `CurrentWeather` and `WeatherCondition` types
└── utils/
    └── tempColor.ts         # Returns a hex colour based on temperature in °C
