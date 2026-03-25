import { useEffect, useState } from "react";
import { type SessionState } from "@workspace/api-client-react";

export function useSessionEvents(sessionCode: string | undefined) {
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;

    let eventSource: EventSource;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource(`/api/sessions/${sessionCode}/events`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(data);
        } catch (e) {
          console.error("Failed to parse session state:", e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Simple reconnect logic
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [sessionCode]);

  return { state, error, isConnected };
}
