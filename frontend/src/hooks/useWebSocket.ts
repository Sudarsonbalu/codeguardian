import { useEffect, useRef } from 'react';
import { useReviewStore } from '../store/reviewStore';
import { getWsUrl } from '../utils/api';

export const useWebSocket = (reviewId: number | null) => {
  const socketRef = useRef<WebSocket | null>(null);
  const updateReviewProgress = useReviewStore((state) => state.updateReviewProgress);

  useEffect(() => {
    if (!reviewId) return;

    const wsUrl = getWsUrl(`/ws/review/${reviewId}`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected for review ${reviewId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status) {
          updateReviewProgress(reviewId, {
            status: data.status,
            progress: data.progress,
            message: data.message,
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for review ${reviewId}`);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [reviewId, updateReviewProgress]);

  return socketRef.current;
};
