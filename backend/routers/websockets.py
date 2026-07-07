from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.services.websocket_manager import manager
import json

router = APIRouter(prefix="/ws", tags=["websockets"])

@router.websocket("/review/{review_id}")
async def websocket_endpoint(websocket: WebSocket, review_id: int):
    await manager.connect(review_id, websocket)
    try:
        while True:
            # We can receive ping/messages from the client if needed, or simply wait
            data = await websocket.receive_text()
            # If the client sends a message, we can echo or log it
            try:
                payload = json.loads(data)
                # handle client-side ping or requests
                if payload.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(review_id, websocket)
    except Exception:
        manager.disconnect(review_id, websocket)
