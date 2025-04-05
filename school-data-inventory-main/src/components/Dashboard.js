import React, { useState, useEffect } from "react";
import { LayoutGrid, Table, MessageCircle, User, LogOut } from "lucide-react";
import Messages from "./Messages";
import DataTables from "./DataTables";
import { auth, db } from "../config/firebase-config.js";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getDoc, doc, updateDoc } from "firebase/firestore";

const UserDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [userDetails, setUserDetails] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [uname, setUName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = sessionStorage.getItem("uid");
      if (user) {
        try {
          const userRef = doc(db, "users", user);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserDetails(userData);
            setUName(userData.name);
          } else {
            console.error("User  document does not exist!");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      } else {
        console.error("No user UID found in sessionStorage!");
      }
    };

    fetchUserDetails();
  }, []);

  const RenderDashboard = () => (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-xl shadow-lg text-white text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to User Dashboard</h1>
        <p className="text-lg">
          Your personalized space to manage your activities.
        </p>
      </div>
    </div>
  );

  const RenderProfile = () => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold mb-4">Profile</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const updatedUser = {
              ...userDetails,
              name: uname,
            };
            const docRef = doc(db, "users", userDetails.id);
            await updateDoc(docRef, updatedUser);
            alert("Name is changed");
            setUserDetails(updatedUser);
          } catch (error) {
            console.error("Error updating user details:", error);
          }
        }}
      >
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            value={uname}
            onChange={(e) => {
              setUName(e.target.value);
            }}
            className="mt-1 p-2 w-full border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={userDetails.email}
            readOnly
            className="mt-1 p-2 w-full border rounded bg-gray-200 cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Save Changes
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Hamburger Menu for Mobile */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-blue-600"
        >
          <span className="block w-6 h-1 bg-blue-600 mb-1"></span>
          <span className="block w-6 h-1 bg-blue-600 mb-1"></span>
          <span className="block w-6 h-1 bg-blue-600"></span>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`w-full md:w-64 bg-white shadow-xl md:sticky top-0 transition-all duration-300 ${
          sidebarOpen || windowWidth >= 768 ? "block" : "hidden"
        }`}
      >
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-blue-600">
            {sessionStorage.getItem("title")}
          </h2>
          <p className="text-gray-500">User Dashboard</p>
        </div>

        {/* Navigation Menu Items */}
        <nav className="p-4 space-y-2">
          {[
            { icon: LayoutGrid, name: "Dashboard", section: "dashboard" },
            { icon: Table, name: "Inventory Record", section: "tables" },
            { icon: MessageCircle, name: "Messages", section: "messages" },
            { icon: User, name: "Profile", section: "profile" },
          ].map((item) => (
            <button
              key={item.section}
              onClick={() => setActiveSection(item.section)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg ${
                activeSection === item.section
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </button>
          ))}
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={async () => {
                const promptRes = window.confirm("Do you want to Logout?");
                if (promptRes) {
                  try {
                    await signOut(auth);
                    console.log("User  signed out successfully!");
                    sessionStorage.removeItem("emailimp");
                    sessionStorage.removeItem("keyimp");
                    sessionStorage.removeItem("role");
                    sessionStorage.removeItem("uid");
                  } catch (error) {
                    console.error("Error signing out:", error);
                  } finally {
                    console.log("Finally block executed");
                    setTimeout(() => {
                      navigate("/login");
                      window.location.reload();
                    }, 1000);
                  }
                }
              }}
              className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h1>

          {activeSection === "dashboard" && <RenderDashboard />}
          {activeSection === "tables" && <DataTables />}
          {activeSection === "messages" && (
            <Messages userDetails={userDetails} />
          )}
          {activeSection === "profile" && <RenderProfile />}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
