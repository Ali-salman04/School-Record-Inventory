import React, { useState, useEffect } from "react";
import { Trash } from "lucide-react";
import { db } from "../config/firebase-config.js"; // Adjust the path as necessary
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

const InventoryRecord = () => {
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState("");
  const [newTableDescription, setNewTableDescription] = useState("");
  const [editTableId, setEditTableId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    fetchDivisions();
    fetchTables(); // Fetch all tables on initial load
  }, []);

  const fetchDivisions = async () => {
    const querySnapshot = await getDocs(collection(db, "divisions"));
    const divisionsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDivisions(divisionsList);
  };

  const fetchSections = async (divisionId) => {
    const querySnapshot = await getDocs(
      collection(db, `divisions/${divisionId}/sections`)
    );
    const sectionsList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setSections(sectionsList);
  };

  const fetchTables = async () => {
    const querySnapshot = await getDocs(collection(db, "tables"));
    const tablesList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTables(tablesList);
  };

  useEffect(() => {
    fetchTables();
  }, [selectedDivision, selectedSection]);

  const handleDivisionChange = (e) => {
    const divisionId = e.target.value;
    setSelectedDivision(divisionId);
    setSelectedSection("");
    fetchSections(divisionId);
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const handleCreateTable = async () => {
    if (newTableName.trim() === "" || newTableDescription.trim() === "") {
      alert("Please enter both a table name and a description.");
      return;
    }

    const newTable = {
      name: newTableName,
      description: newTableDescription,
      columns: [],
      data: [],
      division: selectedDivision,
      section: selectedSection,
    };

    if (editTableId) {
      // Edit existing table
      const tableRef = doc(db, "tables", editTableId);
      await updateDoc(tableRef, newTable);
      setUpdateMessage("Table updated successfully!");
      setEditTableId(null);
    } else {
      // Create new table
      const docRef = await addDoc(collection(db, "tables"), newTable);
      newTable.id = docRef.id;
      setTables([...tables, newTable]);
      setUpdateMessage("Table created successfully!");
    }

    setNewTableName("");
    setNewTableDescription("");
    setTimeout(() => setUpdateMessage(""), 3000); // Clear message after 3 seconds
  };

  const handleDeleteTable = async (id) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      await deleteDoc(doc(db, "tables", id)); // Delete from the general "tables" collection
      setTables(tables.filter((table) => table.id !== id));
    }
  };

  const handleEditTable = (table) => {
    setNewTableName(table.name);
    setNewTableDescription(table.description);
    setEditTableId(table.id);
  };

  const handleViewTable = (table) => {
    setSelectedTable(table);
  };

  const goBack = () => {
    setSelectedTable(null);
    setNewColumnName("");
  };

  const addRow = async (tableId) => {
    const newRow = Object.fromEntries(
      selectedTable.columns.map((col) => [col, ""])
    );
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, {
      data: [...selectedTable.data, newRow],
    });
    setSelectedTable({
      ...selectedTable,
      data: [...selectedTable.data, newRow],
    });
  };

  const addColumn = async (tableId) => {
    if (newColumnName.trim() === "") {
      alert("Please enter a column name.");
      return;
    }

    const tableRef = doc(db, "tables", tableId);
    const updatedColumns = [...selectedTable.columns, newColumnName];
    const updatedData = selectedTable.data.map((row) => ({
      ...row,
      [newColumnName]: "", // Initialize new column with empty string
    }));

    await updateDoc(tableRef, {
      columns: updatedColumns,
      data: updatedData,
    });
    setSelectedTable({
      ...selectedTable,
      columns: updatedColumns,
      data: updatedData,
    });
    setNewColumnName("");
  };

  const deleteColumn = async (tableId, columnName) => {
    if (window.confirm("Are you sure you want to delete this column?")) {
      const tableRef = doc(db, "tables", tableId);
      const updatedColumns = selectedTable.columns.filter(
        (col) => col !== columnName
      );
      const updatedData = selectedTable.data.map((row) => {
        const { [columnName]: _, ...restRow } = row;
        return restRow;
      });

      await updateDoc(tableRef, {
        columns: updatedColumns,
        data: updatedData,
      });
      setSelectedTable({
        ...selectedTable,
        columns: updatedColumns,
        data: updatedData,
      });
    }
  };

  const updateRow = (index, column, value) => {
    setSelectedTable((prev) => {
      const updatedData = prev.data.map((row, i) =>
        i === index ? { ...row, [column]: value } : row
      );
      return { ...prev, data: updatedData };
    });
  };

  const saveRow = async (tableId, row) => {
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, {
      data: selectedTable.data,
    });
    setUpdateMessage("Row saved successfully!");
    setTimeout(() => setUpdateMessage(""), 3000); // Clear message after 3 seconds
  };

  const deleteRow = async (tableId, rowId) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const updatedData = selectedTable.data
        .filter((_, index) => index !== rowId)
        .map((row, index) => ({
          ...row,
          ID: index + 1,
        }));
      const tableRef = doc(db, "tables", tableId);
      await updateDoc(tableRef, {
        data: updatedData,
      });
      setSelectedTable({
        ...selectedTable,
        data: updatedData,
      });
    }
  };

  // Filter tables based on selected division and section
  const filteredTables = tables.filter((table) => {
    if (selectedDivision && selectedSection) {
      return (
        table.division === selectedDivision && table.section === selectedSection
      );
    }
    return true; // Show all tables if no division/section is selected
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      {!selectedTable ? (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-md mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-700 w-full text-center sm:text-left mb-2 sm:mb-0">
              Inventory Record
            </h2>
          </div>

          {updateMessage && (
            <div className="bg-green-100 text-green-700 p-2 rounded mb-4">
              {updateMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6 bg-white p-4 rounded-lg shadow-md">
            <select
              value={selectedDivision}
              onChange={handleDivisionChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
            >
              <option value="" disabled>
                Select Division
              </option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Enter table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
            />
            <input
              type="text"
              placeholder="Enter table description"
              value={newTableDescription}
              onChange={(e) => setNewTableDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0"
            />
            <button
              onClick={handleCreateTable}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {editTableId ? "Update Table" : "Create Table"}
            </button>
          </div>

          <div className="mt-4 sm:mt-6">
            {filteredTables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                        {table.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {table.description}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 justify-between items-center">
                      <button
                        onClick={() => handleViewTable(table)}
                        className="text-blue-600 font-medium text-sm sm:text-base flex-grow"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditTable(table)}
                        className="text-blue-600 font-medium text-sm sm:text-base flex-grow"
                      >
                        Edit Table Name
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-blue-600 font-medium text-sm sm:text-base flex-grow"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center mt-6">
                No tables created yet.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <button
            onClick={goBack}
            className="bg-gray-200 text-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg mb-4"
          >
            Back
          </button>
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            {selectedTable.name}
          </h3>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
            <button
              onClick={() => addRow(selectedTable.id)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Add Row
            </button>
            <input
              type="text"
              placeholder="New Column Name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button
              onClick={() => addColumn(selectedTable.id)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Add Column
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  {selectedTable.columns.map((column) => (
                    <th
                      key={column}
                      className="px-2 sm:px-4 py-2 text-left relative text-sm sm:text-base"
                    >
                      {column}
                      <button
                        onClick={() => deleteColumn(selectedTable.id, column)}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-red-600 text-sm bg-red-600 text-white py-1 px-1 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </th>
                  ))}
                  <th className="px-2 sm:px-4 py-2 text-left text-sm sm:text-base">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedTable.data.map((row, index) => (
                  <tr key={index} className="border-b">
                    {selectedTable.columns.map((column) => (
                      <td key={column} className="px-2 sm:px-4 py-2">
                        <input
                          type="text"
                          value={row[column] || ""}
                          onChange={(e) =>
                            updateRow(index, column, e.target.value)
                          }
                          className="w-full p-1 sm:p-2 border border-gray-300 rounded text-sm sm:text-base"
                        />
                      </td>
                    ))}
                    <td className="px-2 sm:px-4 py-2 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => saveRow(selectedTable.id, row)}
                        className="w-full sm:w-auto bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => deleteRow(selectedTable.id, index)}
                        className="w-full sm:w-auto bg-red-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base"
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

export default InventoryRecord;
