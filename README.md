# React Weather App — Project Documentation

A React Native weather app built with Expo. Users log in, save cities, and view real-time weather pulled from the OpenWeatherMap API.

## Features

### Authentication
- Email and password login via Supabase
- Account creation from the same screen
- Forgot password flow (sends reset email)
- Input validation before any network call (email format, minimum password length)
- Friendly error messages —> "Incorrect email or password." instead of raw API errors
- After login, the back stack is cleared so users can't navigate back to the login screen
- Logout clears the session and resets navigation to Login

### Home Screen
- Time-based greeting —> Good morning, afternoon..
- Current location weather card (uses device GPS)
  - City, country, and local time for that timezone
  - Large temperature display, colour-coded by heat
  - Feels like temperature
  - Horizontal hourly forecast scroll (next few slots)
  - "View Details" button
- Saved cities list — each row shows:
  - Weather icon, city and country, local time, temperature in chosen unit
- Add City modal with live autocomplete (up to 5 suggestions, uses lat/lon to avoid "City not found")
  - Close (×) button and backdrop tap to dismiss
- Inline feedback messages (success/error) that auto-dismiss
- Settings gear icon in the top-right corner

### Weather Detail Screen
- Full-screen detail view for any saved city
- Hero: city name, large temperature, description, local time
- Stats grid: Feels Like, Humidity, Wind, Min/Max temp, Pressure, Visibility, Sunrise, Sunset
- 5-day forecast with weather icon, description, high/low per day
- Themed loading screen (shows "Fetching data…")
- Back button in top-left corner
- Last updated timestamp

### Settings Screen
- Toggle between Celsius and Fahrenheit — persisted across sessions
- Home theme mode — choose what drives the app's colour theme:
  - **Current Location** — matches your GPS location's weather
  - **Top City** — matches the first saved city
  - **Fixed** — pick a condition manually (Clear, Clouds, Rain, Snow, Thunderstorm)
- Fixed theme picker: compact rounded-square swatches, one per condition
- Settings screen itself follows the active theme (live-updates when switching modes)
- Logout button

### UI & Theming
- Weather-based colour themes — each condition has day and night variants
- Night mode detected automatically from sunrise/sunset timestamps per city
- Semi-transparent cards (glass effect via rgba) so the background gradient shows through
- Geometric background decorations (circles, lines) matching the weather theme
- Temperature colours — blue for freezing through red for hot
- Safe area aware on iOS, Android, and web
- No native headers — fully custom layout on every screen

### API & Data
- OpenWeatherMap API for current weather, forecast, and geocoding
- Coordinate-based lookups (current location + autocomplete selection) prevent name-mismatch errors
- City autocomplete via geocoding API, limited to 5 results, deduplicated
- All fields parsed: temp, feels like, min/max, humidity, wind, pressure, visibility, sunrise/sunset, timezone offset
- City weather fetches run in parallel (`Promise.allSettled`) for faster load times
- API key loaded from environment variables via `expo-constants`

### SDK Compatibility
- Main branch targets Expo SDK 55
- `version-fix` branch targets Expo SDK 54 for use with the current Expo Go App Store release


## Bug Fixes & Improvements

| What was fixed | Details |
|---|---|
| Status bar overlap on iOS | Added `useSafeAreaInsets` with `paddingTop` on all screens |
| Inconsistent city names | Always shows `weather.city, weather.country` from API response |
| Night theme always active | `isNightTime` was comparing `Date.now()/1000` (seconds) against ms-stored timestamps — fixed |
| Autocomplete "City not found" | Labels like "London, GB" failed the weather API; now uses lat/lon from suggestion |
| White flash on WeatherDetail | Passes `background` colour as nav param, used in loading state |
| Settings theme not live-updating | Now passes all four theme params (location + top, each with night flag) so Settings reacts immediately |
| Android login crash | Fixed navigation reset after login on Android |
| Unit change not reflected | Temperature unit reloads on focus via `useFocusEffect` |
| Sequential city weather fetches | Changed `for` loop to `Promise.allSettled` — all cities fetch in parallel |
| Duplicate city suggestions | Deduplicated by label and coordinates |
| Settings loaded twice on mount | Removed redundant `useEffect`, kept only `useFocusEffect` |
| Duplicate API response parsing | Extracted shared `parseWeatherData()` helper in `openWeather.ts` |


## Environment Variables

In a `.env` file in the project root:

```
OPENWEATHER_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

These are loaded via `expo-constants` and accessed as `Constants.expoConfig.extra.*`.


## Test Coverage

Tests live in `__tests__/`. Run with:
```
npm test                # run all tests
npm run test:coverage   # run with coverage report
npm run test:watch      # watch mode
```

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

```
src/
├── components/
│   ├── CityRow.tsx              # City row with icon, name, local time, temperature
│   └── ThemeBackground.tsx      # Decorative geometric shapes (circles, lines)
├── navigation/
│   ├── RootNavigator.tsx        # Stack navigator (Login → Home → WeatherDetail / Settings)
│   └── types.ts                 # Route param types
├── screens/
│   ├── HomeScreen.tsx           # Greeting, location card, saved cities, add city modal
│   ├── LoginScreen.tsx          # Auth screen — login, signup, forgot password
│   ├── SettingsScreen.tsx       # Unit toggle, theme mode picker, logout
│   ├── SplashScreen.tsx         # Initial loading screen
│   └── WeatherDetailScreen.tsx  # Full detail + 5-day forecast for a city
├── services/
│   ├── cities.ts                # Supabase CRUD for saved cities
│   ├── openWeather.ts           # Weather by city, by coords, city suggestions, forecast
│   └── supabase.ts              # Supabase client setup
├── storage/
│   ├── keys.ts                  # Storage key constants
│   ├── secure.ts                # Platform-aware secure storage
│   └── settings.ts              # User preferences (unit, homeTheme, fixedTheme)
├── theme/
│   └── weatherTheme.ts          # Day/night themes per condition + isNightTime()
├── types/
│   └── weather.ts               # CurrentWeather, ForecastDay, ForecastSlot types
└── utils/
    ├── format.ts                # formatTemp() — unit-aware temperature string
    ├── tempColor.ts             # Hex colour based on °C value
    └── useLocalTime.ts          # Hook — local time string from timezone offset, ticks every 10s
```
