import { useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, Send, Phone, Settings, Wifi, WifiOff,
  CheckCircle, AlertCircle, Users, FileText, Activity
} from 'lucide-react'

const DEFAULT_GATEWAY = 'ws://localhost:18789'
const DEFAULT_TOKEN = 'e33ec557f6bcfe891db39597fca9f951b69c2286350814a1'

function App() {
  const [gatewayUrl, setGatewayUrl] = useState(() => 
    localStorage.getItem('gatewayUrl') || DEFAULT_GATEWAY
  )
  const [token, setToken] = useState(() => 
    localStorage.getItem('token') || DEFAULT_TOKEN
  )
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [status, setStatus] = useState({ whatsapp: 'unknown', telegram: 'unknown' })
  const [stats, setStats] = useState({ messagesToday: 0, activeChats: 0 })
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }
    
    setConnecting(true)
    
    try {
      const ws = new WebSocket(gatewayUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setConnecting(false)
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'authenticate',
          params: { token }
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (e) {
          console.log('Raw message:', event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnected(false)
        setConnecting(false)
      }

      ws.onclose = () => {
        setConnected(false)
        setConnecting(false)
      }
    } catch (e) {
      console.error('Connection error:', e)
      setConnecting(false)
    }
  }

  const handleMessage = (data) => {
    if (data.method === 'channels/status') {
      setStatus(data.result?.channels || { whatsapp: 'unknown', telegram: 'unknown' })
    }
    
    if (data.method === 'message/new' || data.result?.type === 'message') {
      const msg = data.result || data.params
      if (msg) {
        setMessages(prev => [...prev, {
          id: msg.id || Date.now(),
          text: msg.text || msg.content || '',
          sender: msg.from || msg.sender || 'unknown',
          timestamp: msg.timestamp || Date.now(),
          direction: msg.outgoing ? 'outgoing' : 'incoming'
        }])
        setStats(prev => ({ ...prev, messagesToday: prev.messagesToday + 1 }))
      }
    }
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || !wsRef.current) return

    const msg = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'channels/whatsapp/send',
      params: {
        to: '+13199300290',
        text: inputMessage
      }
    }

    wsRef.current.send(JSON.stringify(msg))
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: inputMessage,
      sender: 'You',
      timestamp: Date.now(),
      direction: 'outgoing'
    }])
    setInputMessage('')
  }

  const saveSettings = () => {
    localStorage.setItem('gatewayUrl', gatewayUrl)
    localStorage.setItem('token', token)
    setShowSettings(false)
    connect()
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f0f' }}>
      {/* Sidebar */}
      <div style={{ 
        width: 260, 
        background: '#1a1a1a', 
        borderRight: '1px solid #333',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={24} color="#25D366" />
            WhatsApp
          </h1>
          <p style={{ color: '#888', fontSize: 12, marginTop: 5 }}>OpenClaw Dashboard</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 15, flex: 1 }}>
          <div style={{ 
            padding: 15, 
            background: connected ? 'rgba(37,211,102,0.1)' : 'rgba(255,59,48,0.1)',
            borderRadius: 10,
            border: `1px solid ${connected ? '#25D366' : '#ff3b30'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {connected ? <Wifi size={18} color="#25D366" /> : <WifiOff size={18} color="#ff3b30" />}
              <span style={{ fontWeight: 600 }}>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <div style={{ padding: 15, background: '#252525', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Activity size={18} color="#007AFF" />
              <span style={{ fontWeight: 600 }}>Status</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              {status.whatsapp === 'linked' ? 
                <CheckCircle size={14} color="#25D366" /> : 
                <AlertCircle size={14} color="#ff3b30" />
              }
              <span style={{ fontSize: 13, color: '#aaa' }}>WhatsApp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {status.telegram === 'enabled' ? 
                <CheckCircle size={14} color="#25D366" /> : 
                <AlertCircle size={14} color="#888" />
              }
              <span style={{ fontSize: 13, color: '#aaa' }}>Telegram</span>
            </div>
          </div>

          <div style={{ padding: 15, background: '#252525', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Users size={18} color="#007AFF" />
              <span style={{ fontWeight: 600 }}>Stats</span>
            </div>
            <div style={{ fontSize: 13, color: '#aaa' }}>
              <div>Messages today: {stats.messagesToday}</div>
              <div>Active chats: {stats.activeChats}</div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: 12,
            background: '#333',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            marginTop: 20
          }}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ 
          padding: '15px 25px', 
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>+1 319 930 0290</h2>
            <p style={{ fontSize: 13, color: '#25D366' }}>Online</p>
          </div>
          <button 
            onClick={connect}
            disabled={connecting}
            style={{ 
              padding: '8px 16px',
              background: connected ? '#333' : '#25D366',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: connected ? 'default' : 'pointer'
            }}
          >
            {connecting ? 'Connecting...' : connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              marginTop: 100 
            }}>
              <MessageCircle size={48} color="#333" style={{ marginBottom: 15 }} />
              <p>No messages yet</p>
              <p style={{ fontSize: 13 }}>Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id}
                style={{ 
                  display: 'flex', 
                  justifyContent: msg.direction === 'outgoing' ? 'flex-end' : 'flex-start',
                  marginBottom: 15
                }}
              >
                <div style={{ 
                  maxWidth: '60%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: msg.direction === 'outgoing' ? '#25D366' : '#333',
                  color: '#fff'
                }}>
                  <p style={{ wordBreak: 'break-word' }}>{msg.text}</p>
                  <p style={{ 
                    fontSize: 11, 
                    color: msg.direction === 'outgoing' ? 'rgba(255,255,255,0.7)' : '#888',
                    marginTop: 5,
                    textAlign: 'right'
                  }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} style={{ 
          padding: 20, 
          borderTop: '1px solid #333',
          display: 'flex',
          gap: 10
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ 
              flex: 1,
              padding: '12px 16px',
              borderRadius: 24,
              border: '1px solid #333',
              background: '#1a1a1a',
              color: '#fff',
              outline: 'none'
            }}
          />
          <button 
            type="submit"
            disabled={!connected || !inputMessage.trim()}
            style={{ 
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#25D366',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: 30,
            borderRadius: 16,
            width: 400,
            border: '1px solid #333'
          }}>
            <h2 style={{ marginBottom: 20 }}>Settings</h2>
            
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#888' }}>
                Gateway URL
              </label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                placeholder="ws://localhost:18789"
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #333',
                  background: '#0f0f0f',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 25 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#888' }}>
                Auth Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter token"
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #333',
                  background: '#0f0f0f',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setShowSettings(false)}
                style={{ 
                  flex: 1,
                  padding: 12,
                  background: '#333',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                style={{ 
                  flex: 1,
                  padding: 12,
                  background: '#25D366',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
