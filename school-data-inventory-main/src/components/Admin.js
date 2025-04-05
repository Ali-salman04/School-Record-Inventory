import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  TableProperties,
  Boxes,
  Edit,
  Eye,
  X,
  Check,
  Trash,
  MessageCircle,
  LogOut,
} from "lucide-react";
import RequestManagement from "./RequestMangement";
import Messages from "./Messages";
import InventoryRecord from "./InventoryRecord";
import {
  collection,
  getDocs,
  addDoc,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase-config";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase-config.js";
import {
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";

const Admin = () => {
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState({});
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("");
  const [section, setSection] = useState("");
  const [division, setDivision] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDetailUserModalOpen, setIsDetailUserModalOpen] = useState(false);
  const [isUpdateSectionModalOpen, setIsUpdateSectionModalOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [dbDivisions, setDbDivisions] = useState([]);
  const [dbRawSections, setDbRawSections] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [title, setTitle] = useState(
    sessionStorage.getItem("title" || "Error! No Data in DB")
  );
  const [userCre, setUserCre] = useState({});
  // To updtae Section use this state
  const [divisionAndSection, setDivisionAndSection] = useState({
    division_id: "",
    section_id: "",
    section_name: "",
    division_name: "",
  });

  const navigate = useNavigate();

  const handleAddUser = async () => {
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
    let newUser = {
      name: userName,
      email,
      position,
      role,
      section_id: section,
      division_id: division,
      contact,
      password,
    };
    await signOut(auth);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newUser.email,
      newUser.password
    );
    const userr = userCredential.user;
    const uid = userr.uid;
    newUser = {
      ...newUser,
      id: uid,
    };
    await setDoc(doc(db, "users", uid), newUser);
    await signOut(auth);
    const eemail = sessionStorage.getItem("emailimp");
    const ppassword = sessionStorage.getItem("keyimp");
    await signInWithEmailAndPassword(auth, eemail, ppassword);
    alert("User added successfully!");
    setIsAddUserModalOpen(false);
    resetUserForm();
    setUserName("");
  };

  const handleEditUser = async () => {
    try {
      if (!selectedUser || !selectedUser.id) {
        alert("No user selected for update!");
        return;
      }

      // Create an object with only the fields that need to be updated
      const updatedFields = {
        name: user.name || selectedUser.name,
        position: user.position || selectedUser.position,
        role: user.role || selectedUser.role,
        division_id: user.division_id || selectedUser.division_id,
        section_id: user.section_id || selectedUser.section_id,
        contact: user.contact || selectedUser.contact,
      };

      const userDocRef = doc(db, "users", selectedUser.id);
      await updateDoc(userDocRef, updatedFields);

      const updatedUsers = dbUsers.map((u) =>
        u.id === selectedUser.id ? { ...u, ...updatedFields } : u
      );
      setDbUsers(updatedUsers);

      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user!");
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsDetailUserModalOpen(true);
  };

  // Login function for delteion of user
  const loginUser = async (email, ppassword) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        ppassword
      );
      const user = userCredential.user;
      console.log("User logged in:", user);
      return user;
    } catch (error) {
      console.error("Error logging in:", error.message);
      throw error;
    }
  };
  // Handle Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      // Fetch the user document from Firestore
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        alert("User not found!");
        return;
      }
      await deleteDoc(userDocRef);

      // Log in as the user to delete their Firebase Authentication account
      const tempUser = await loginUser(
        userDoc.data().email,
        userDoc.data().password
      );
      console.log(tempUser);
      await deleteUser(tempUser);

      // Log back in as the admin user
      console.log(userCre);
      await loginUser(userCre.em, userCre.ps);

      // Update the local state to remove the deleted user
      const updatedUsers = dbUsers.filter((u) => u.id !== userId);
      setDbUsers(updatedUsers);

      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user!");
    }
  };

  const resetUserForm = () => {
    setUser("");
    setEmail("");
    setPosition("");
    setRole("");
    setSection("");
    setDivision("");
    setContact("");
    setPassword("");
  };

  // Handle Title update
  const handleTitleUpdate = async () => {
    const propmtRes = window.confirm("Do You want to change Title?");
    if (!propmtRes) return;
    sessionStorage.setItem("title", title);
    const docRef = doc(db, "websiteData", "title");
    // await setDoc(docRef, { title: "School Inventory System" }); For overwrite Whole Document
    await updateDoc(docRef, { title: title });
  };
  useEffect(() => {
    // Set Title State
    setUserCre({
      em: sessionStorage.getItem("emailimp"),
      ps: sessionStorage.getItem("keyimp"),
    });
    setTitle(sessionStorage.getItem("title") || "Error! No Data in DB");
    // Handle Responsiveness
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Manage Divisions", icon: <Building2 className="h-5 w-5" /> },
    { name: "Manage Sections", icon: <Boxes className="h-5 w-5" /> },
    { name: "Manage Users", icon: <Users className="h-5 w-5" /> },
    { name: "Inventory Record", icon: <TableProperties className="h-5 w-5" /> },
    { name: "Manage Requests", icon: <Edit className="h-5 w-5" /> },
    { name: "Messages", icon: <MessageCircle className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const GeneralFetchData = async () => {
      try {
        // Fetch Divisions
        const divisionsCollection = collection(db, "divisions");
        const divisionsSnapshot = await getDocs(divisionsCollection);
        const divisionsList = divisionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDbDivisions(divisionsList);

        // Fetch Sections for Each Division
        const allSections = [];
        for (let i = 0; i < divisionsList.length; i++) {
          const sectionCollection = collection(
            db,
            `divisions/${divisionsList[i].id}/sections`
          );
          const sectionSnapshot = await getDocs(sectionCollection);
          const sectionList = sectionSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            division_id: divisionsList[i].id,
          }));
          allSections.push(...sectionList);
        }
        setDbRawSections(allSections);

        // Fetch Users
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs
          .filter((doc) => {
            if (doc.data().email === sessionStorage.getItem("emailimp")) {
              return false;
            }
            return true;
          })
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        setDbUsers(usersList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    GeneralFetchData();
  }, [selectedMenu, division, section, dbUsers, divisionAndSection]);
  // Dashboard Component Start
  const RenderDashboard = () => (
    <div className="space-y-4 text-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-100 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-xl font-semibold mb-2">Total Divisions</h4>
          <p className="text-3xl font-bold text-blue-600">
            {dbDivisions.length}
          </p>
        </div>
        <div className="bg-green-100 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-xl font-semibold mb-2">Total Sections</h4>
          <p className="text-3xl font-bold text-green-600">
            {dbRawSections.length}
          </p>
        </div>
        <div className="bg-purple-100 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-xl font-semibold mb-2">Total Users</h4>
          <p className="text-3xl font-bold text-purple-600">{dbUsers.length}</p>
        </div>
      </div>
    </div>
  );
  // Dashboard Component End

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4">
        <button onClick={() => setIsOpen(!isOpen)} className="text-blue-600">
          <span className="block w-6 h-1 bg-blue-600 mb-1"></span>
          <span className="block w-6 h-1 bg-blue-600 mb-1"></span>
          <span className="block w-6 h-1 bg-blue-600"></span>
        </button>
      </div>
      {/* Sidebar */}
      <div
        className={`w-full md:w-64 bg-white shadow-xl md:sticky top-0 transition-all duration-300 ${
          isOpen || windowWidth >= 768 ? "block" : "hidden"
        }`}
      >
        <div className="p-6 border-b bg-white shadow-md rounded-lg text-center">
          {/* Editable Title */}
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                handleTitleUpdate();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.key === "Enter" && setIsEditing(false);
                  handleTitleUpdate();
                }
              }}
              autoFocus
              className="text-2xl font-semibold text-blue-600 border-b-2 border-blue-600 outline-none px-2 transition-all w-full text-center"
            />
          ) : (
            <h2 className="text-2xl font-bold text-blue-600">{title}</h2>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-3 p-2 rounded-lg bg-gray-100 hover:bg-blue-100 transition flex items-center justify-center mx-auto"
          >
            {isEditing ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Edit className="h-5 w-5 text-gray-500 hover:text-blue-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setSelectedMenu(item.name)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                selectedMenu === item.name
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </button>
          ))}
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={async () => {
                const promptRes = window.confirm("Do you want to Logout?");
                if (promptRes) {
                  try {
                    await signOut(auth);
                    console.log("User signed out successfully!");
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6">{selectedMenu}</h2>
          {/* Dashboard */}
          {selectedMenu === "Dashboard" && <RenderDashboard />}
          {/* Division Section Start */}
          {selectedMenu === "Manage Divisions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Division Name"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-2/3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Add logic to create a new division
                    if (division) {
                      const docRef = collection(db, "divisions");
                      addDoc(docRef, { name: division });
                      setDivision("");
                    } else {
                      alert("Please enter a division name");
                    }
                  }}
                >
                  Add Division
                </button>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Division Name
                      </th>
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Delete Action
                      </th>
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Update Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbDivisions.map((div) => (
                      <tr key={div.id} className="border-b">
                        <td className="px-4 py-2">{div.name}</td>
                        <td className="px-4 py-2 space-x-2">
                          <button
                            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                            onClick={async () => {
                              // Delete logic
                              const promptRes = window.confirm(
                                `Are you sure you want to delete ${div.name} division? The Sections under ${div.name} dividion will also be deleted.`
                              );
                              if (promptRes) {
                                await deleteDoc(doc(db, "divisions", div.id));
                                setDbDivisions(
                                  dbDivisions.filter((d) => d.id !== div.id)
                                );
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          <button
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={async () => {
                              const updatedName = prompt(
                                "Enter the new division name:",
                                div.name
                              );
                              if (updatedName && updatedName !== div.name) {
                                await updateDoc(doc(db, "divisions", div.id), {
                                  name: updatedName,
                                });
                                setDbDivisions(
                                  dbDivisions.map((d) =>
                                    d.id === div.id
                                      ? { ...d, name: updatedName }
                                      : d
                                  )
                                );
                              }
                            }}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Division End */}

          {/* Add Section Start */}
          {selectedMenu === "Manage Sections" && (
            <div className="space-y-4">
              {/* Division and Section Input */}
              <div className="flex gap-4">
                <select
                  value={selectedDivision}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value);
                    console.log(e.target.value);
                  }}
                  className="w-1/3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="" disabled>
                    Select Division
                  </option>
                  {dbDivisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Section Name"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-2/3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              {/* Add Section Button */}
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
                onClick={async () => {
                  if (section) {
                    const newSection = {
                      name: section,
                    };
                    const divisionsRef = collection(
                      db,
                      `divisions/${selectedDivision}/sections`
                    );
                    await addDoc(divisionsRef, newSection);
                    setDbRawSections([...dbRawSections, newSection]);
                    setSection("");
                  } else {
                    alert("Please enter a section name");
                  }
                }}
              >
                Add Section
              </button>
              {/* Section Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Section Name
                      </th>
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Division Name
                      </th>
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Delete Action
                      </th>
                      <th className="px-4 py-2 font-semibold text-sm text-gray-600">
                        Update Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbRawSections
                      .filter((div) => {
                        return div.division_id === selectedDivision;
                      })
                      .map((sec) => (
                        <tr key={sec.id}>
                          <td className="px-4 py-2">{sec.name}</td>
                          <td className="px-4 py-2">
                            {
                              dbDivisions.find(
                                (div) => div.id === sec.division_id
                              )?.name
                            }
                          </td>
                          <td className="px-4 py-2 space-x-2">
                            <button
                              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                              onClick={async () => {
                                console.log(selectedDivision);
                                const promptRes = window.confirm(
                                  `Are you sure you want to delete ${
                                    sec.name
                                  } secton under ${
                                    dbDivisions.find(
                                      (div) => div.id === selectedDivision
                                    )?.name
                                  } Division`
                                );
                                if (promptRes) {
                                  await deleteDoc(
                                    doc(
                                      db,
                                      `divisions/${selectedDivision}/sections/${sec.id}`
                                    )
                                  );
                                  setDbRawSections(
                                    dbRawSections.filter(
                                      (div) => div.id !== sec.id
                                    )
                                  );
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                          <td className="px-4 py-2 space-x-2">
                            <button
                              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                              onClick={() => {
                                setIsUpdateSectionModalOpen(true);
                                const sectDivi = dbDivisions.find(
                                  (div) => div.id === sec.division_id
                                )?.name;
                                setDivisionAndSection({
                                  division_name: sectDivi,
                                  section_name: sec.name,
                                  division_id: selectedDivision,
                                  section_id: sec.id,
                                });
                              }}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Add Sections End */}

          {/* Account Request Management */}
          {selectedMenu === "Manage Requests" && <RequestManagement />}

          {/* messages */}
          {selectedMenu === "Messages" && <Messages />}

          {/* Inventory Record */}

          {selectedMenu === "Inventory Record" && <InventoryRecord />}

          {/* Add Users */}
          {selectedMenu === "Manage Users" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add User
                </button>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      {[
                        "Name",
                        "Email",
                        "Position",
                        "Role",
                        "Section",
                        "Division",
                        "Mobile Number",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 font-semibold text-sm text-gray-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dbUsers.map((user, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{user.name}</td>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">{user.position}</td>
                        <td className="px-4 py-2">{user.role}</td>
                        <td className="px-4 py-2">
                          {dbRawSections
                            .filter((sec) => {
                              return sec.id === user.section_id;
                            })
                            .map((sec) => {
                              return sec.name;
                            })}
                        </td>
                        <td className="px-4 py-2">
                          {dbDivisions
                            .filter((div) => {
                              return div.id === user.division_id;
                            })
                            .map((div) => {
                              return div.name;
                            })}
                        </td>
                        <td className="px-4 py-2">{user.contact}</td>
                        <td className="px-4 py-2 space-x-2">
                          <button
                            onClick={() => {
                              setUser(user);
                              setSelectedUser(user);
                              setIsEditUserModalOpen(true);
                            }}
                            className="bg-yellow-500 text-white py-1 px-1 rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleViewDetails(user)}
                            className="bg-blue-600 text-white py-1 px-1 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 text-white py-1 px-1 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add User Modal */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6">
              <div className="bg-white rounded-lg p-6 shadow-lg w-96">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Add New User</h3>
                  <button
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <input
                    type="text"
                    placeholder="User Name"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Company Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select Role
                    </option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="" disabled>
                      Select Division
                    </option>
                    {dbDivisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select Section
                    </option>
                    {dbRawSections
                      .filter((sec) => {
                        return sec.division_id === division;
                      })
                      .map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name}
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Mobile Number"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleAddUser}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add User
                  </button>
                  <button
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {isEditUserModalOpen && selectedUser && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-lg w-96">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Edit User</h3>
                  <button
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <input
                    type="text"
                    placeholder="User Name"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Company Email"
                    value={user.email}
                    onChange={(e) => alert("Email Cannot be changed!")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={user.position}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        position: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={user.role}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        role: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus
                      :ring-blue-500"
                  >
                    <option disabled>Select Role of User</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  <select
                    value={user.division_id}
                    onChange={(e) => {
                      setUser({
                        ...user,
                        division_id: e.target.value,
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option disabled>Select Division</option>
                    {dbDivisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={user.section_id}
                    onChange={(e) => {
                      setUser({
                        ...user,
                        section_id: e.target.value,
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option disabled>Select Section</option>
                    {dbRawSections
                      .filter((sec) => {
                        return sec.division_id === user.division_id;
                      })
                      .map((sec) => {
                        return (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        );
                      })}
                  </select>
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    value={user.contact}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        contact: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={handleEditUser}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Update Section Popup */}
          {isUpdateSectionModalOpen && (
            <div className="fixed inset-0 z-10 flex justify-center items-center bg-gray-900/50">
              <div className="bg-white p-8 rounded-lg shadow-md w-96 animate-fade-in">
                <h2 className="text-lg font-bold mb-4">Update Section</h2>

                {/* Changing Under Division */}
                <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg shadow-lg">
                  <h3 className="block text-2xl font-bold text-white tracking-wider uppercase shadow-md">
                    {`${divisionAndSection.division_name} Division`}
                  </h3>
                </div>

                {/* Section Name Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    New Section Name
                  </label>
                  <input
                    type="text"
                    value={divisionAndSection.section_name}
                    onChange={(e) =>
                      setDivisionAndSection({
                        ...divisionAndSection,
                        section_name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new section name"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsUpdateSectionModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const divisionsRef = collection(
                          db,
                          `divisions/${divisionAndSection.division_id}/sections`
                        );
                        const sectionRef = doc(
                          divisionsRef,
                          divisionAndSection.section_id
                        );
                        await updateDoc(sectionRef, {
                          name: divisionAndSection.section_name,
                        });
                        setIsUpdateSectionModalOpen(false);
                        alert("Section Updated Successfully!");
                        setDivisionAndSection({
                          ...divisionAndSection,
                          section_name: "",
                        });
                      } catch (error) {
                        console.log(error);
                        alert("Error in Updating the section!");
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* View User Details Modal */}
          {isDetailUserModalOpen && selectedUser && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-lg w-96">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">User Details</h3>
                  <button
                    onClick={() => setIsDetailUserModalOpen(false)}
                    className="text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <p>
                    <strong>User Name: </strong>
                    {selectedUser.name}
                  </p>
                  <p>
                    <strong>Email: </strong>
                    {selectedUser.email}
                  </p>
                  <p>
                    <strong>Position: </strong>
                    {selectedUser.position}
                  </p>
                  <p>
                    <strong>Role: </strong>
                    {selectedUser.role}
                  </p>
                  <p>
                    <strong>Division: </strong>
                    {dbDivisions
                      .filter((div) => {
                        return div.id === selectedUser.division_id;
                      })
                      .map((div) => {
                        return div.name;
                      })}
                  </p>
                  <p>
                    <strong>Section: </strong>
                    {dbRawSections
                      .filter((sec) => {
                        return sec.id === selectedUser.section_id;
                      })
                      .map((sec) => {
                        return sec.name;
                      })}
                  </p>
                  <p>
                    <strong>Mobile Number: </strong>
                    {selectedUser.contact}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsDetailUserModalOpen(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
