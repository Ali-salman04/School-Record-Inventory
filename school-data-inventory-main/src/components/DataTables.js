import React, { useState, useEffect } from "react";
import { db, auth } from "../config/firebase-config.js"; // Adjust the path as necessary
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";

const DataTables = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingRow, setEditingRow] = useState({});
  const [userSectionId, setUserSectionId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userQuery = query(
          collection(db, "users"),
          where("id", "==", auth.currentUser.uid)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserSectionId(userData.section_id);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchTables = async () => {
      if (userSectionId === null) return; // Wait until userSectionId is set

      try {
        const tablesSnapshot = await getDocs(collection(db, "tables"));
        const tablesList = tablesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter tables based on user's section ID
        const filteredTables = tablesList.filter(
          (table) => table.section === userSectionId
        );
        setTables(filteredTables);
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };

    fetchTables();
  }, [userSectionId]);

  const selectTable = (tableName) => {
    const table = tables.find((table) => table.name === tableName);
    setSelectedTable(table);
  };

  const goBack = () => {
    setSelectedTable(null);
  };

  const addRow = async () => {
    if (!selectedTable) return;

    const newRow = {
      ID: selectedTable.data.length + 1,
      Name: "",
      Date: "",
      Status: "",
    };

    const updatedData = [...selectedTable.data, newRow];

    // Update Firestore
    await setDoc(doc(db, "tables", selectedTable.id), {
      ...selectedTable,
      data: updatedData,
    });

    setSelectedTable((prev) => ({
      ...prev,
      data: updatedData,
    }));
  };

  const updateRow = (rowId, column, value) => {
    setEditingRow((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [column]: value,
      },
    }));
  };

  const saveRow = async (rowId) => {
    const updatedData = selectedTable.data.map((row) =>
      row.ID === rowId ? { ...row, ...editingRow[rowId] } : row
    );

    // Update Firestore
    await setDoc(doc(db, "tables", selectedTable.id), {
      ...selectedTable,
      data: updatedData,
    });

    // Update local state
    setSelectedTable((prev) => ({
      ...prev,
      data: updatedData,
    }));

    // Clear editing row and show feedback
    setEditingRow((prev) => {
      const updated = { ...prev };
      delete updated[rowId];
      return updated;
    });

    alert("Row updated successfully!"); // Feedback for update
  };

  const deleteRow = async (rowId) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const updatedData = selectedTable.data.filter((row) => row.ID !== rowId);

      // Update Firestore
      await setDoc(doc(db, "tables", selectedTable.id), {
        ...selectedTable,
        data: updatedData,
      });

      // Update local state
      setSelectedTable((prev) => ({
        ...prev,
        data: updatedData,
      }));

      alert("Row deleted successfully!"); // Feedback for delete
    }
  };

  return (
    <div className="space-y-6">
      {!selectedTable ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-xl shadow-md p-6 cursor-pointer"
              onClick={() => selectTable(table.name)}
            >
              <h3 className="text-xl font-semibold">{table.name}</h3>
              <p className="text-gray-600">{table.description}</p>
              <div className="flex space-x-4 mt-4">
                <button className="text-blue-600 font-medium">View</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6">
          <button
            onClick={goBack}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg mb-4"
          >
            Back
          </button>
          <h3 className="text-xl font-semibold mb-4">{selectedTable.name}</h3>

          <div className="flex space-x-2 mb-4">
            <button
              onClick={addRow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  {selectedTable.columns.map((column) => (
                    <th key={column} className="px-4 py-2 text-left">
                      {column}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedTable.data.map((row) => (
                  <tr key={row.ID} className="border-b">
                    {selectedTable.columns.map((column) => (
                      <td key={column} className="px-4 py-2">
                        <input
                          type="text"
                          value={editingRow[row.ID]?.[column] ?? row[column]}
                          onChange={(e) =>
                            updateRow(row.ID, column, e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => saveRow(row.ID)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => deleteRow(row.ID)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTables;
