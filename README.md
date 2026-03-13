# React Weather App

A cross-platform weather app built with React Native and Expo. Designed to feel polished and production-ready — not a tutorial clone.

## Stack

| Layer | Technology |
| Framework | React Native + Expo (TypeScript) |
| Auth & DB | Supabase |
| Weather Data | OpenWeatherMap API |
| AI Insights | Groq API |

## Highlights

- **AI weather insights** — Groq generates simple summary, cached in AsyncStorage for 1 hour to avoid redundant calls
- **Coordinate-based city lookup** — autocomplete resolves cities to lat/lon upfront, so weather fetches are more accurate
- **Dynamic theming** — colour scheme adapts to weather condition (Clear, Rain etc) and switches between day/night theme based on city times
- **GPS location card** — detects current location and shows live weather with an hourly forecast scroll
- **Multi-city management** — save cities, view details, swipe to remove, pull to refresh
- **Unit tests** — covers API parsing, temperature logic, auth flows, storage, and theming

## Setup

**1. API Keys**

- https://openweathermap.org/api — free tier is enough
- https://supabase.com — create a project, grab the URL and anon key
- https://console.groq.com — free tier, used for AI insights (optional)

**2. Supabase table**

In your Supabase project, create a `user_cities` table:

| Column | Type | Notes |
| `id` | int8 | primary key |
| `user_id` | uuid | references `auth.users` |
| `city` | text | |
| `lat` | float8 | nullable |
| `lon` | float8 | nullable |

Enable Row Level Security and add a policy so users can only access their own rows.

**3. Environment variables**

Create a `.env` in the project root:

```
OPENWEATHER_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=your_groq_key_here

```

**4. Run**

```
npm install
npx expo start

npm test for testing

```

> Full details in DOCS.md
