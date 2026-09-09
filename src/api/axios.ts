import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const envUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = envUrl ? (envUrl.endsWith('/') ? envUrl : `${envUrl}/`) : "http://localhost:8000/";

export const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        "Content-Type": 'application/json',
    }
});

// Automatically attach Supabase JWT token to every request
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    } catch {
        // Proceed without auth header if session not available
    }
    return config;
});