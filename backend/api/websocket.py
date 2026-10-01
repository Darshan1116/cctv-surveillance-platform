import json
import logging
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from ingestion.mqtt_publisher import mqtt_bus

logger = logging.getLogger('ws_manager')

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        mqtt_bus.subscribe_internal('#', self._handle_bus_message)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    def broadcast(self, message: dict):
        import asyncio
        payload = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(connection.send_text(payload))
            except Exception:
                pass

    def _handle_bus_message(self, topic: str, payload: dict):
        msg_type = "EVENT"
        if "alerts" in topic:
            msg_type = "ALERT"
        elif "health" in topic:
            msg_type = "HEALTH"
        elif "trigger" in topic:
            msg_type = "IOT_TRIGGER"
            
        message = {
            "topic": topic,
            "type": msg_type,
            "data": payload
        }
        
        import asyncio
        for connection in list(self.active_connections):
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(connection.send_text(json.dumps(message)))
            except Exception:
                pass

ws_manager = WebSocketManager()
