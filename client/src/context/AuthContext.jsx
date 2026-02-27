import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api.js';
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    // On mount or token change, optionally fetch user profile
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const response = await api.get("admin/me");
                    setUser(response.data);
                } catch (error) {
                    console.error("Invalid token");
                    localStorage.removeItem("token");
                    setToken(null);
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (username, password) => {
        try {
            const response = await api.post('admin/signin', { username, password }, { withCredentials: true });

            if (!response.data.token) {
                throw new Error("Token not received from backend");
            }

            const newToken = response.data.token;

            const userData = {
                _id: response.data._id,
                username: response.data.username
            };

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (username, password) => {
        try {
            const response = await api.post('admin/signup', { username, password }, { withCredentials: true });
            const { token: newToken, user: userData } = response.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData || { token: newToken });

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        token,
        isAuthenticated: !!token // helper boolean
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};