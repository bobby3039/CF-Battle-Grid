import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import socket from '../socket';
import '../styles/Chat.css';

const MAX_MESSAGES = 100; // Maximum number of messages to store per channel
const MAX_MESSAGE_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function Chat({ roomId, handle, team }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeChannel, setActiveChannel] = useState('general'); // 'general', 'teamA', 'teamB'
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const sentMessagesRef = useRef(new Set()); // Track sent message IDs

  // Load messages from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(`chat_${roomId}_${activeChannel}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // Filter out old messages
        const now = Date.now();
        const recentMessages = parsedMessages.filter(msg => {
          const msgTime = new Date(msg.timestamp).getTime();
          return now - msgTime < MAX_MESSAGE_AGE;
        });
        setMessages(recentMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]); // Reset to empty if there's an error
    }
  }, [roomId, activeChannel]);

  // Save messages to localStorage with cleanup
  useEffect(() => {
    try {
      // Keep only the most recent messages
      const recentMessages = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(`chat_${roomId}_${activeChannel}`, JSON.stringify(recentMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
      // If storage is full, remove old messages
      try {
        const oldMessages = messages.slice(-Math.floor(MAX_MESSAGES / 2));
        localStorage.setItem(`chat_${roomId}_${activeChannel}`, JSON.stringify(oldMessages));
      } catch (storageError) {
        console.error('Failed to save even with cleanup:', storageError);
      }
    }
  }, [messages, roomId, activeChannel]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    socket.on('chatMessage', (message) => {
      // Check if this is a message we sent (avoid duplicates)
      if (!sentMessagesRef.current.has(message.id) &&
          (message.channel === activeChannel || 
           (message.channel === 'teamA' && team === 'teamA') ||
           (message.channel === 'teamB' && team === 'teamB'))) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socket.off('chatMessage');
    };
  }, [activeChannel, team]);

  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedFile) return;

    const messageId = Date.now();
    const message = {
      id: messageId,
      handle,
      team,
      channel: activeChannel,
      timestamp: new Date().toISOString(),
      content: newMessage.trim(),
      file: selectedFile
    };

    // Add to sent messages set
    sentMessagesRef.current.add(messageId);

    // Add message locally with cleanup if needed
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      return updatedMessages.slice(-MAX_MESSAGES); // Keep only the most recent messages
    });
    
    // Emit to others
    socket.emit('chatMessage', message);

    // Clean up
    setNewMessage('');
    setSelectedFile(null);
    setShowEmojiPicker(false);

    // Remove from sent messages set after a while
    setTimeout(() => {
      sentMessagesRef.current.delete(messageId);
    }, 5000); // Clear after 5 seconds
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  // const canViewChannel = (channel) => {
  //   if (channel === 'general') return true;
  //   return channel === team;
  // };

  return (
    <div className="chat-container">
      {/* Channel Tabs */}
      <div className="chat-tabs">
        <button
          onClick={() => setActiveChannel('general')}
          className={`chat-tab ${activeChannel === 'general' ? 'active' : ''}`}
        >
          General
        </button>
        {team === 'teamA' && (
          <button
            onClick={() => setActiveChannel('teamA')}
            className={`chat-tab team-a ${activeChannel === 'teamA' ? 'active' : ''}`}
          >
            Same Team
          </button>
        )}
        {team === 'teamB' && (
          <button
            onClick={() => setActiveChannel('teamB')}
            className={`chat-tab team-b ${activeChannel === 'teamB' ? 'active' : ''}`}
          >
            Same Team
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {messages
          .filter(msg => msg.channel === activeChannel)
          .map(message => (
            <div
              key={message.id}
              className={`message ${message.handle === handle ? 'own-message' : ''}`}
            >
              <div className={`message-sender ${message.team === 'teamA' ? 'team-a' : 'team-b'}`}>
                {message.handle}
              </div>
              {message.content && (
                <div className="message-content">{message.content}</div>
              )}
              {message.file && (
                <div className="message-file">
                  {message.file.type.startsWith('image/') ? (
                    <img 
                      src={message.file.data} 
                      alt="Shared content"
                      className="message-image"
                    />
                  ) : (
                    <a 
                      href={message.file.data}
                      download={message.file.name}
                      className="message-file-link"
                    >
                      📎 {message.file.name}
                    </a>
                  )}
                </div>
              )}
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        {selectedFile && (
          <div className="selected-file">
            <span className="selected-file-name">
              📎 {selectedFile.name}
            </span>
            <button
              onClick={() => setSelectedFile(null)}
              className="remove-file-btn"
            >
              ✕
            </button>
          </div>
        )}
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="message-input"
          />
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="emoji-btn"
          >
            😊
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="file-input"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="file-btn"
          >
            📎
          </button>
          <button
            onClick={handleSendMessage}
            className="send-btn"
          >
            <span>Send</span>
          </button>
        </div>
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat; 