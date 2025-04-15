"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import Image from "next/image";
import ChatInput from "apps/user-ui/src/shared/components/chats/chatinput";

const mockChats = [
  {
    id: "1",
    name: "Becodemy",
    avatar:
      "https://ik.imagekit.io/fz0xzwtey/avatar/6_N7eMmuAvl.png?updatedAt=1742269698784",
    online: true,
    messages: [
      {
        from: "user",
        text: "Hi Shahriar. Thanks for your new order!",
        time: "02:46",
        seen: true,
      },
      {
        from: "seller",
        text: "Thank you too!",
        time: "02:46",
        seen: false,
      },
    ],
  },
];

const ChatPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [chats, setChats] = useState<any[]>(mockChats);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  // On first render or when query changes
  useEffect(() => {
    const conversationId = searchParams.get("conversationId");
    const chat = chats.find((c) => c.id === conversationId);
    setSelectedChat(chat || null);
  }, [searchParams, chats]);

  const handleChatSelect = (chat: any) => {
    router.push(`?conversationId=${chat.id}`);
  };

  const handleSend = (e: any) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg = {
      from: "user",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      seen: false,
    };

    const updated = chats.map((chat) => {
      if (chat.id === selectedChat.id) {
        const updatedChat = { ...chat, messages: [...chat.messages, newMsg] };
        setSelectedChat(updatedChat);
        return updatedChat;
      }
      return chat;
    });

    setChats(updated);
    setMessage("");
  };

  const getLastMessage = (chat: any) =>
    chat.messages.length > 0
      ? chat.messages[chat.messages.length - 1].text
      : "";

  const getUnseenCount = (chat: any) =>
    chat.messages.filter((m: any) => !m.seen && m.from !== "user").length;

  return (
    <div className="w-full">
      <div className="md:w-[80%] mx-auto pt-5">
        <div className="flex h-[80vh] shadow-sm overflow-hidden">
          {/* Sidebar */}
          <div className="w-[320px] border-r border-r-gray-200 bg-gray-50">
            <div className="p-4 border-b border-b-gray-200 text-lg font-semibold text-gray-800">
              Messages
            </div>
            <div className="divide-y divide-gray-200">
              {chats.map((chat) => {
                const unseen = getUnseenCount(chat);
                const isActive = selectedChat?.id === chat.id;

                return (
                  <button
                    key={chat.id}
                    onClick={() => handleChatSelect(chat)}
                    className={`w-full text-left px-4 py-3 transition hover:bg-blue-50 ${
                      isActive ? "bg-blue-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={chat.avatar}
                        alt={chat.name}
                        width={36}
                        height={36}
                        className="rounded-full border w-[40px] h-[40px] object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`${
                              unseen > 0 ? "font-semibold" : ""
                            } text-sm text-gray-800`}
                          >
                            {chat.name}
                          </span>
                          {chat.online && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate max-w-[170px]">
                            {getLastMessage(chat)}
                          </p>
                          {unseen > 0 && (
                            <span className="ml-2 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5">
                              {unseen > 9 ? "9+" : unseen}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex flex-col flex-1 bg-gray-100">
            {selectedChat ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-b-gray-200 bg-white flex items-center gap-3">
                  <Image
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                    width={40}
                    height={40}
                    className="rounded-full border w-[40px] h-[40px] object-cover border-gray-200"
                  />
                  <div>
                    <h2 className="text-gray-800 font-semibold text-base">
                      {selectedChat.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedChat.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm">
                  {selectedChat.messages.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        msg.from === "user" ? "items-end ml-auto" : "items-start"
                      } max-w-[80%]`}
                    >
                      <div
                        className={`${
                          msg.from === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-800"
                        } px-4 py-2 rounded-lg shadow-sm w-fit`}
                      >
                        {msg.text}
                      </div>
                      <div
                        className={`text-[11px] text-gray-400 mt-1 flex items-center gap-1 ${
                          msg.from === "user" ? "mr-1 justify-end" : "ml-1"
                        }`}
                      >
                        {msg.time}
                        {msg.from === "user" && msg.seen && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSendMessage={handleSend}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
