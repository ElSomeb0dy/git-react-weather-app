# React Weather App

A cross-platform weather app built with React Native and Expo.

![CI](https://github.com/ElSomeb0dy/git-react-weather-app/actions/workflows/ci.yml/badge.svg)

## Screenshots

| Home                          | Weather Detail                           |
| ----------------------------- | ---------------------------------------- |
| ![Home](assets/demo/home.png) | ![Detail](assets/demo/weatherdetail.png) |

## Stack

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| Framework    | React Native + Expo (TypeScript) |
| Auth & DB    | Supabase                         |
| Weather Data | OpenWeatherMap API               |
| AI Insights  | Groq API (llama-3.1-8b-instant)  |

## Highlights

- **AI weather insights:** AI generates a casual weather summary + clothing suggestion per city, cached to avoid redundant calls

- **Coordinate-based city lookup:** autocomplete resolves cities to lat/lon upfront, so weather fetches are accurate

- **Dynamic theming:** colour scheme adapts to weather condition and includes day/night based on the city's actual sunrise/sunset times

- **GPS location card:** detects current location and shows live weather with an hourly forecast

- **Multi-city management:** save cities, view details, swipe to remove, pull to refresh

- **Unit tests:** covers API parsing, temperature logic, auth flows, storage, and theming

## Setup

**1. API Keys**

- [OpenWeatherMap](https://openweathermap.org/api): free tier is enough
- [Supabase](https://supabase.com): create a project, grab the URL and anon key
- [Groq](https://console.groq.com): free tier, used for AI insights (optional)

**2. Supabase table**

In your Supabase project, create a `user_cities` table:

| Column    | Type   | Notes                   |
| --------- | ------ | ----------------------- |
| `id`      | int8   | primary key             |
| `user_id` | uuid   | references `auth.users` |
| `city`    | text   |                         |
| `lat`     | float8 | nullable                |
| `lon`     | float8 | nullable                |

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

```bash
npm install
npx expo start (--tunnel if needed)
npm test        # run tests
```

> Full implementation details in [DOCS.md](DOCS.md)

## Potential warnings

`npm install` and `npx expo start` may show some warnings. The project targets **Expo SDK 54** to match the version on the App Store / Play Store keeping all packages pinned to SDK 54-compatible versions is what causes these warnings.
