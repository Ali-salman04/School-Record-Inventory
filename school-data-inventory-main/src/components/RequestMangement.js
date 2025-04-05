import React, { useState, useEffect } from "react";
import { db, auth } from "../config/firebase-config.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const RequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [userCre, setUserCre] = useState({});

  const handleAccept = async (id) => {
    const user = requests.find((request) => {
      if (request.id === id) {
        request.status = "accepted";
        return true;
      }
      return false;
    });
    if (user) {
      try {
        await deleteDoc(doc(db, "user_request", user.id));
        await signOut(auth);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          user.email,
          user.password
        );
        const userr = userCredential.user;
        const uid = userr.uid;

        // Save only the required fields to the 'users' collection
        const userData = {
          id: uid,
          name: user.name,
          email: user.email,
          contact: user.contact,
          position: user.position,
          role: user.role,
          division_id: user.division_id,
          section_id: user.section_id,
          password: user.password,
        };

        await setDoc(doc(db, "users", uid), userData);

        await signOut(auth);
        await signInWithEmailAndPassword(auth, userCre.em, userCre.ps);
        alert("User Approved successfully!");
        setRequests(requests.filter((request) => request.id !== id));
      } catch (error) {
        console.error("Error while approving user:", error);
        alert("An error occurred while approving user!");
      }
    }
  };

  const handleReject = async (id) => {
    try {
      await deleteDoc(doc(db, "user_request", id));
      setRequests(requests.filter((request) => request.id !== id));
    } catch (error) {
      console.error("Error while rejecting user:", error);
      alert("An error occurred while rejecting user!");
    }
  };

  const getDivisionName = async (divisionId) => {
    const q = doc(db, "divisions", divisionId);
    const divSnapshot = await getDoc(q);
    if (divSnapshot.exists()) {
      return divSnapshot.data().name || "N/A";
    } else {
      console.error("Division not found for ID:", divisionId);
      return "N/A";
    }
  };

  const getSectionName = async (divisionId, sectionId) => {
    const q = collection(db, `divisions/${divisionId}/sections`);
    const secSnapshot = await getDocs(q);
    const section = secSnapshot.docs.find((doc) => doc.id === sectionId);
    if (section) {
      return section.data().name || "N/A";
    } else {
      console.error("Section not found for ID:", sectionId);
      return "N/A";
    }
  };

  useEffect(() => {
    setUserCre({
      em: sessionStorage.getItem("emailimp"),
      ps: sessionStorage.getItem("keyimp"),
    });
    const fetchUsersRequestedList = async () => {
      try {
        const user_req = collection(db, "user_request");
        const user_req_snapshot = await getDocs(user_req);
        const user_req_List = user_req_snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const updatedRequests = await Promise.all(
          user_req_List.map(async (request) => {
            const division = await getDivisionName(request.division_id);
            const section = await getSectionName(
              request.division_id,
              request.section_id
            );
            return { ...request, division, section };
          })
        );

        setRequests(updatedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchUsersRequestedList();
  }, []);

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  );

  return (
    <div className=" md:overflow-visible overflow-x-auto rounded-lg shadow-lg bg-gray-50">
      <table className="w-full table-auto border-collapse text-left text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="border px-3 py-3">Name</th>
            <th className="border px-3 py-3">Email</th>
            <th className="border px-3 py-3">Division</th>
            <th className="border px-3 py-3">Section</th>
            <th className="border px-3 py-3 w-32">Contact</th>
            <th className="border px-3 py-3">Role</th>
            <th className="border px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="border px-6 py-4">{request.name}</td>
                <td className="border px-6 py-4">{request.email}</td>
                <td className="border px-6 py-4">{request.division}</td>
                <td className="border px-6 py-4">{request.section}</td>
                <td className="border px-6 py-4">{request.contact}</td>
                <td className="border px-6 py-4">{request.role}</td>
                <td className="border px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleAccept(request.id)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="7"
                className="border px-6 py-4 text-center text-gray-500"
              >
                No requests available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestManagement;
