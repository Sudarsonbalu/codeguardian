from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Maps review_id to a list of WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, review_id: int, websocket: WebSocket):
        await websocket.accept()
        if review_id not in self.active_connections:
            self.active_connections[review_id] = []
        self.active_connections[review_id].append(websocket)

    def disconnect(self, review_id: int, websocket: WebSocket):
        if review_id in self.active_connections:
            self.active_connections[review_id].remove(websocket)
            if not self.active_connections[review_id]:
                del self.active_connections[review_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_review(self, review_id: int, message: dict):
        if review_id in self.active_connections:
            payload = json.dumps(message)
            for connection in self.active_connections[review_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    # Connection might be closed, clean up in place or let disconnect handle it
                    pass

manager = ConnectionManager()
