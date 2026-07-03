import React, { useState, useRef, useEffect } from 'react';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !apiKey.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'APIリクエストに失敗しました');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `エラー: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ChatGPT App</h1>
      </header>

      <div className="api-key-section">
        <label htmlFor="api-key">OpenAI APIキー:</label>
        <div className="api-key-input-wrapper">
          <input
            id="api-key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-... を入力してください"
            className="api-key-input"
          />
          <button
            className="toggle-visibility-btn"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? '隠す' : '表示'}
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>メッセージを入力して会話を始めましょう</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-label">
                {msg.role === 'user' ? 'あなた' : 'ChatGPT'}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-label">ChatGPT</div>
              <div className="message-content loading">考え中...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-section">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={apiKey ? 'メッセージを入力... (Enter で送信)' : 'まずAPIキーを入力してください'}
            disabled={!apiKey || isLoading}
            rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !apiKey || isLoading}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
