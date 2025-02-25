"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error.message);
        return;
      }
      if (data.session?.user) {
        setUser(data.session.user);
        localStorage.setItem("session", JSON.stringify(data.session)); // Store session
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem("session", JSON.stringify(session));
      } else {
        setUser(null);
        localStorage.removeItem("session");
      }
    });

    return () => {
      authListener.subscription?.unsubscribe(); // Cleanup listener on unmount
    };
  }, []);

  // 🔹 Login function
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login failed:", error.message);
      return "Wrong Credentials";
    }
    setUser(data.user);
    localStorage.setItem("session", JSON.stringify(data));
    return data.user;
  };

  // 🔹 Signup function
  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Signup failed:", error.message);
      return "Signup Error";
    }
    setUser(data.user);
    localStorage.setItem("session", JSON.stringify(data));
    return data.user;
  };

  // 🔹 Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("session");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
