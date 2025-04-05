import React, { useState, useEffect } from "react";
import { db } from "../config/firebase-config.js";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const AccountRequest = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [contact, setContact] = useState("");
  const [division_id, setDivision_Id] = useState("");
  const [section_id, setSection_Id] = useState("");
  const navigate = useNavigate();

  // fetching divisions and sections from database
  const [dbDivisions, setDbDivisions] = useState([]);
  const [dbSections, setDbSections] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      name,
      email,
      position,
      role,
      section_id,
      division_id,
      contact,
      password,
      status: "pending",
    };
    try {
      if (password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const user_req_Query = query(
        collection(db, "user_request"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(userQuery);
      const user_req_QuerySnapshot = await getDocs(user_req_Query);
      if (!querySnapshot.empty) {
        alert("User with this email already exists");
        return;
      } else if (!user_req_QuerySnapshot.empty) {
        alert("User with this email already has a pending request");
        return;
      }
      const userRequestCollection = collection(db, "user_request");
      await addDoc(userRequestCollection, formData);
      setName("");
      setEmail("");
      setPosition("");
      setRole("");
      setContact("");
      setDivision_Id("");
      setSection_Id("");
      setDbDivisions([]);
      setDbSections([]);
      alert("Request submitted successfully!");
      console.log("Request submitted with:", formData);
      navigate("/login");
    } catch (error) {
      console.error("Error submitting request:", error.message);
      alert(`Error submitting request: ${error.message}`);
    }
  };

  const fetchSections = async (id) => {
    try {
      const sectionsCollectionRef = collection(db, `divisions/${id}/sections`);
      const querySnapshot = await getDocs(sectionsCollectionRef);
      const sectionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDbSections(sectionsList);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  useEffect(() => {
    const fetchDbData = async () => {
      // Fetch Divisions
      const divisionsCollection = collection(db, "divisions");
      const divisionsSnapshot = await getDocs(divisionsCollection);
      const divisionsList = divisionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDbDivisions(divisionsList);
    };

    fetchDbData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-blue-600 p-8 flex flex-col items-center relative w-full">
            {/* Back Arrow */}
            <button
              onClick={() => window.history.back()}
              className="absolute left-4 top-4 text-white hover:text-blue-200"
            >
              <ArrowLeft size={24} />
            </button>

            <h2 className="text-2xl font-bold text-white">
              Request an Account
            </h2>
            <p className="text-blue-100 mt-2">
              Please fill in the details to request an account
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Company Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Company Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your company email"
                required
              />
            </div>

            {/* Position Field */}
            <div className="space-y-2">
              <label
                htmlFor="position"
                className="block text-sm font-medium text-gray-700"
              >
                Position
              </label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your position"
                required
              />
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role"
                type="text"
                value={role}
                onChange={(e) => {
                  if (e.target.value === "admin" || e.target.value === "user") {
                    setRole(e.target.value);
                  } else {
                    setRole("");
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your role"
                required
              >
                <option value="" disabled>
                  Select a role
                </option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Division Field */}
            <div className="space-y-2">
              <label
                htmlFor="division"
                className="block text-sm font-medium text-gray-700"
              >
                Division
              </label>
              <select
                id="division"
                value={division_id}
                onChange={(e) => {
                  if (e.target.value) {
                    setDivision_Id(e.target.value);
                    fetchSections(e.target.value);
                  } else {
                    setDivision_Id("");
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="" disabled>
                  Select a division
                </option>
                {dbDivisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Section Field */}
            <div className="space-y-2">
              <label
                htmlFor="section"
                className="block text-sm font-medium text-gray-700"
              >
                Section
              </label>
              <select
                id="section"
                value={section_id}
                onChange={(e) => {
                  if (e.target.value) {
                    setSection_Id(e.target.value);
                  } else {
                    setSection_Id("");
                  }
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="" disabled>
                  Select a section
                </option>
                {dbSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Number Field */}
            <div className="space-y-2">
              <label
                htmlFor="mobileNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Mobile Number
              </label>
              <input
                id="mobileNumber"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your mobile number"
                required
              />
            </div>
            {/* {Password Field} */}
            <div className="space-y-2">
              <label
                htmlFor="Password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter a Password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountRequest;
