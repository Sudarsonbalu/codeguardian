import { useEffect, useRef } from 'react';
import { useReviewStore } from '../store/reviewStore';
import { getApiUrl, getWsUrl } from '../utils/api';

export const useWebSocket = (reviewId: number | null) => {
  const socketRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateReviewProgress = useReviewStore((state) => state.updateReviewProgress);

  useEffect(() => {
    if (!reviewId) return;

    let isWsConnected = false;

    // HTTP Polling Fallback Function for Vercel Serverless Environments
    const startPollingFallback = () => {
      if (pollIntervalRef.current) return;

      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}`));
          if (res.ok) {
            const data = await res.json();
            updateReviewProgress(reviewId, {
              status: data.status,
              progress: data.status === 'completed' ? 100 : (data.status === 'processing' ? 50 : 0),
              message: data.status === 'completed' ? 'Analysis Complete' : `Status: ${data.status}`,
            });

            if (data.status === 'completed' || data.status === 'failed') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          }
        } catch (e) {
          console.warn('Review status polling fallback failed:', e);
        }
      }, 3000);
    };

    try {
      const wsUrl = getWsUrl(`/ws/review/${reviewId}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        isWsConnected = true;
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
        console.warn('WebSocket error, switching to HTTP status polling fallback:', error);
        startPollingFallback();
      };

      ws.onclose = () => {
        if (!isWsConnected) {
          startPollingFallback();
        }
      };
    } catch (e) {
      console.warn('WebSocket init failed, starting polling fallback:', e);
      startPollingFallback();
    }

    return () => {
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        socketRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [reviewId, updateReviewProgress]);

  return socketRef.current;
};
