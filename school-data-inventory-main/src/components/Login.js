import React, { useState, useEffect } from "react";
import { Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { auth, db } from "../config/firebase-config.js";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem("keyimp", password);
      sessionStorage.setItem("emailimp", email);
      sessionStorage.setItem("uid", auth.currentUser.uid);
      console.log("Successfully signed in!", auth.currentUser);
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

      if (userDoc.exists()) {
        const roll = userDoc.data().role;
        console.log("User Role:", roll);
        window.dispatchEvent(new Event("storage"));
        if (roll === "admin") {
          sessionStorage.setItem("role", "admin");
          navigate("/admin");
        } else {
          sessionStorage.setItem("role", "user");
          navigate("/dashboard");
        }
      } else {
        console.log("User not found");
      }
    } catch (error) {
      sessionStorage.clear();
      setError("Wrong Credentials! Please Enter valid Credentials");
      console.log("An error occurred while signing in:", error.message);
    }
  };
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 p-8 flex flex-col items-center">
            {error && (
              <div className="bg-red-200 p-2 rounded-lg text-red-700 mb-4">
                {error}
              </div>
            )}
            <h2 className="text-2xl font-bold text-white">
              {`Welcome to ${sessionStorage.getItem("title")}`}
            </h2>
            <p className="text-blue-100 mt-2">Please sign in to continue</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            <div className="text-right">
              <Link
                to="/request"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Account Request?
              </Link>
            </div>
            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
