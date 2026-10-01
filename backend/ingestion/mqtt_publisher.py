import json
import logging
import threading
import time

logger = logging.getLogger('mqtt_publisher')

class MQTTPublisher:
    """Lightweight MQTT Publisher with local in-memory fallback bus."""
    def __init__(self, host: str = 'localhost', port: int = 1883):
        self.host = host
        self.port = port
        self.client = None
        self.is_connected = False
        self.listeners = {}
        self._init_client()
        
    def _init_client(self):
        try:
            import paho.mqtt.client as mqtt
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2) if hasattr(mqtt, 'CallbackAPIVersion') else mqtt.Client()
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            t = threading.Thread(target=self._try_connect, daemon=True)
            t.start()
        except Exception as e:
            logger.warning(f"MQTT library notice: {e}. Using internal bus.")

    def _try_connect(self):
        try:
            self.client.connect(self.host, self.port, 5)
            self.client.loop_start()
            self.is_connected = True
        except Exception:
            self.is_connected = False

    def _on_connect(self, client, userdata, flags, rc, *args):
        self.is_connected = (rc == 0)

    def _on_disconnect(self, client, userdata, rc, *args):
        self.is_connected = False

    def subscribe_internal(self, topic_prefix: str, callback):
        if topic_prefix not in self.listeners:
            self.listeners[topic_prefix] = []
        self.listeners[topic_prefix].append(callback)

    def subscribe(self, topic: str, callback):
        prefix = topic.rstrip('#').rstrip('/')
        self.subscribe_internal(prefix if prefix else '#', callback)

    def publish(self, topic: str, payload: dict):
        payload_str = json.dumps(payload)
        if self.is_connected and self.client:
            try:
                self.client.publish(topic, payload_str)
            except Exception:
                pass
                
        for prefix, callbacks in self.listeners.items():
            if topic.startswith(prefix) or prefix == '#':
                for cb in callbacks:
                    try:
                        cb(topic, payload)
                    except Exception as e:
                        logger.error(f"Error in bus listener: {e}")

mqtt_bus = MQTTPublisher()
