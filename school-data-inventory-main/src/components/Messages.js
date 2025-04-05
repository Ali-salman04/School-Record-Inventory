import React, { useState, useEffect } from "react";
import { Send, Search, ArrowLeft, Plus } from "lucide-react";
import { db, auth } from "../config/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

const ChatApp = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [chats, setChats] = useState([]);
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...userDoc.data(), id: auth.currentUser.uid });
        } else {
          console.error("Current user not found in Firestore.");
        }
      } else {
        console.error("No authenticated user found.");
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch chats for the current user after 2 seconds
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const fetchChats = async () => {
        try {
          const chatsQuery = query(
            collection(db, "chats"),
            where("user1Id", "==", currentUser.id)
          );
          const chatsQuery2 = query(
            collection(db, "chats"),
            where("user2Id", "==", currentUser.id)
          );

          const [userChats1, userChats2] = await Promise.all([
            getDocs(chatsQuery),
            getDocs(chatsQuery2),
          ]);

          const userChats = [
            ...userChats1.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
            ...userChats2.docs.map((doc) => ({ ...doc.data(), id: doc.id })),
          ];

          setChats(userChats);
          console.log("All Chats:", userChats);
        } catch (error) {
          console.error("Error fetching chats:", error);
        }
      };

      // Simulate a delay of 2 seconds before fetching chats
      const delay = setTimeout(() => {
        fetchChats();
      }, 2000);

      return () => clearTimeout(delay);
    }
  }, [currentUser]);

  // Real-time listener for chats
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const chatsQuery = query(
        collection(db, "chats"),
        where("user1Id", "==", currentUser.id)
      );
      const chatsQuery2 = query(
        collection(db, "chats"),
        where("user2Id", "==", currentUser.id)
      );

      const unsubscribe1 = onSnapshot(chatsQuery, (snapshot) => {
        const updatedChats = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setChats((prevChats) => [
          ...updatedChats,
          ...prevChats.filter(
            (chat) => !updatedChats.some((c) => c.id === chat.id)
          ),
        ]);
      });

      const unsubscribe2 = onSnapshot(chatsQuery2, (snapshot) => {
        const updatedChats = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setChats((prevChats) => [
          ...updatedChats,
          ...prevChats.filter(
            (chat) => !updatedChats.some((c) => c.id === chat.id)
          ),
        ]);
      });

      return () => {
        unsubscribe1();
        unsubscribe2();
      };
    }
  }, [currentUser]);

  // Real-time listener for messages in the selected chat
  useEffect(() => {
    if (selectedChat && selectedChat.id) {
      const unsubscribe = onSnapshot(
        collection(db, "chats", selectedChat.id, "messages"),
        (snapshot) => {
          const updatedMessages = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setSelectedChat((prevChat) => ({
            ...prevChat,
            messages: updatedMessages,
          }));
        }
      );

      return () => unsubscribe();
    }
  }, [selectedChat]);

  // Handle selecting a chat
  const handleSelectChat = (chat) => {
    setSelectedChat({ ...chat, messages: chat.messages || [] });
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChat) {
      const newMessage = {
        senderId: currentUser.id,
        text: messageInput,
        timestamp: new Date(),
        read: false,
      };

      try {
        // Add message to Firestore
        await addDoc(
          collection(db, "chats", selectedChat.id, "messages"),
          newMessage
        );

        // Update last message in the chat document
        await updateDoc(doc(db, "chats", selectedChat.id), {
          lastMessage: messageInput,
          lastMessageTimestamp: new Date(),
        });

        // Clear the input field
        setMessageInput("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Handle creating a new chat
  const handleCreateNewChat = async () => {
    if (!newChatEmail.trim()) {
      alert("Please enter a valid email.");
      return;
    }

    try {
      // Check if the user exists
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", newChatEmail)
      );
      const userSnapshot = await getDocs(usersQuery);

      if (userSnapshot.empty) {
        alert("User  not found!");
        return;
      }

      const otherUser = {
        ...userSnapshot.docs[0].data(),
        id: userSnapshot.docs[0].id,
      };

      if (!currentUser || !currentUser.id || !otherUser || !otherUser.id) {
        console.error("Invalid currentUser  or otherUser .");
        return;
      }

      // Create a new chat document
      const chatId = `${currentUser.id}_${otherUser.id}`;
      console.log("Creating chat with ID:", chatId);

      await setDoc(doc(db, "chats", chatId), {
        id: chatId,
        user1Id: currentUser.id,
        user2Id: otherUser.id,
        lastMessage: "",
        lastMessageTimestamp: null,
        messages: [],
        user1Name: currentUser.name, // Save current user's name
        user2Name: otherUser.name, // Save other user's name
      });

      const newChat = {
        id: chatId,
        name: otherUser.name, // Display the other user's name
        lastMessage: "",
        messages: [],
      };

      setChats([...chats, newChat]);
      setSelectedChat(newChat);
      setShowNewChatPopup(false);
      setNewChatEmail("");
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div
        className={`w-full md:w-1/3 bg-white border-r shadow-lg ${
          selectedChat ? "hidden md:block" : "block"
        }`}
      >
        <div className="p-4 border-b flex items-center gap-2 bg-gray-100">
          <Search className="text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={() => setShowNewChatPopup(true)}
            className="p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={20} />
          </button>
        </div>

        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`p-4 cursor-pointer border-b flex flex-col hover:bg-blue-100 transition ${
                selectedChat?.id === chat.id ? "bg-blue-200" : ""
              }`}
            >
              <h3 className="font-semibold text-gray-800">
                {chat.user1Id === currentUser.id
                  ? chat.user2Name
                  : chat.user1Name}
              </h3>
              <p className="text-gray-500 text-sm truncate">
                {chat.lastMessage}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Panel */}
      <div
        className={`w-full md:w-2/3 flex flex-col bg-white shadow-md rounded-lg ${
          selectedChat ? "block" : "hidden md:block"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center p-4 border-b bg-blue-600 text-white font-semibold">
              <button
                className="md:hidden mr-2 text-white"
                onClick={() => setSelectedChat(null)}
              >
                <ArrowLeft size={20} />
              </button>
              {selectedChat.user1Id === currentUser.id
                ? selectedChat.user2Name
                : selectedChat.user1Name}
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 bg-gray-100">
              {(selectedChat.messages || []).map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.senderId === currentUser.id
                      ? "justify-end"
                      : "justify-start"
                  } mb-4`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-lg text-sm max-w-xs ${
                      msg.senderId === currentUser.id
                        ? "bg-green-600 text-white"
                        : "bg-purple-300 text-gray-800"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-xs text-gray-500 block mt-1">
                      {msg.timestamp?.toDate().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition"
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500 text-lg">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* New Chat Popup */}
      {showNewChatPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">New Chat</h2>
            <input
              type="email"
              value={newChatEmail}
              onChange={(e) => setNewChatEmail(e.target.value)}
              placeholder="Enter user's email"
              className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewChatPopup(false)}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewChat}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
