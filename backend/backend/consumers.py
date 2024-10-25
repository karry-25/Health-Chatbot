import json
from channels.generic.websocket import AsyncWebsocketConsumer
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket connection established")
        await self.accept()

    async def disconnect(self, close_code):
        logger.info("WebSocket connection closed")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')

            if message_type == 'candidate':
                await self.send_candidate(text_data_json['candidate'])
            elif message_type in ['offer', 'answer']:
                await self.send(text_data)
            else:
                logger.warning("Unknown message type: {}".format(message_type))
        except json.JSONDecodeError:
            logger.error("Invalid JSON message")
        except KeyError:
            logger.error("Missing 'type' field in message")

    async def send_candidate(self, candidate):
        try:
            await self.send(text_data=json.dumps({
                'type': 'candidate',
                'candidate': candidate
            }))
        except Exception as e:
            logger.error("Error sending candidate message: {}".format(e))