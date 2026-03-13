import "dotenv/config";

export default ({ config }) => ({
    ...config,
    extra: {
        OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,

        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

        GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
});