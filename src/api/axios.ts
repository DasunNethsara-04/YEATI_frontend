import axios from "axios";

export const api = axios.create({
    baseURL: "https://yeati-backend.vercel.app/",
    withCredentials: true,
    headers: {
        "Content-Type": 'application/json',
    }
});