import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Admin from "./components/Admin";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AccountRequest from "./components/AccountRequest";
import { db } from "./config/firebase-config.js";
import { doc, getDoc } from "firebase/firestore";
import Loader from "./components/Loader.js";

const theme = createTheme();

const App = () => {
  const [user, setUser] = useState(sessionStorage.getItem("uid") || null);
  const [role, setRole] = useState(sessionStorage.getItem("role") || null);
  const [loading, setLoading] = useState(true); // Added loading state

  // Function to check if the user is authenticated
  const isAuthenticated = () => {
    return user !== null && user !== undefined;
  };

  // Function to check if the user is an admin
  const isAdmin = () => {
    return role === "admin";
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(sessionStorage.getItem("uid"));
      setRole(sessionStorage.getItem("role"));
    };

    const getData = async () => {
      await setUser(sessionStorage.getItem("uid"));
      await setRole(sessionStorage.getItem("role"));
    };

    getData();

    // Get Website Title
    const fetchTitle = async () => {
      try {
        setLoading(true); // Start loading
        const docRef = doc(db, "websiteData", "title");
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          const title = docSnapshot.data().title;
          sessionStorage.setItem("title", title);
          document.title = title;
        } else {
          console.log("No such document!");
          sessionStorage.setItem("title", "Error! No Data in DB");
          document.title = "Error! No Data in DB";
        }
      } catch (error) {
        console.error("Error fetching title: ", error);
        sessionStorage.setItem("title", "Error! No Data in DB");
        document.title = "Error! No Data in DB";
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchTitle();

    // Listen for changes in sessionStorage
    window.addEventListener("storage", handleStorageChange);

    // Cleanup listener
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [role, user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Show Loader while loading */}
      {loading && <Loader />}
      <Router>
        <Routes>
          {/* Public Routes (accessible to all users) */}
          <Route
            path="/login"
            element={
              isAuthenticated() ? <Navigate to="/" replace /> : <Login />
            }
          />
          <Route
            path="/request"
            element={
              isAuthenticated() ? (
                <Navigate to="/" replace />
              ) : (
                <AccountRequest />
              )
            }
          />

          {/* Protected Routes (accessible only to authenticated users) */}
          {isAuthenticated() && (
            <>
              {/* Admin-only routes */}
              {isAdmin() && (
                <>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/" element={<Navigate to="/admin" replace />} />
                </>
              )}

              {/* User-only routes */}
              {!isAdmin() && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </>
              )}
            </>
          )}

          {/* Default Route (redirect to login if not authenticated) */}
          <Route
            path="*"
            element={
              isAuthenticated() ? (
                isAdmin() ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
