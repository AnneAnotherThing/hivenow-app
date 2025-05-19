import { useState, useEffect, useCallback } from "react";

type WebSocketMessage = {
  type: string;
  projectId?: number;
  message?: any;
  [key: string]: any;
};

export function useWebSocket(path: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  // Create WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}${path}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connection established");
      setConnected(true);
    };
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [path]);
  
  // Send message function
  const sendMessage = useCallback((data: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [socket, connected]);
  
  return {
    connected,
    messages,
    sendMessage,
  };
}
