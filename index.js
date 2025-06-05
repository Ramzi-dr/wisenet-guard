import dotenv from "dotenv";
import WebSocket from "ws";
import EventEmitter from "events";
import https from "https";
import { logger } from "./logger.js";
import sendEmail from "./emailManager.js";
import TokenManager from "./tokenManager.js";
import handleIncomingMessage from "./handleIncomingMessage.js";
import handleAsana from "./AsanaManager.js";

// Load .env
dotenv.config();

class WebSocketClient extends EventEmitter {
  constructor(token) {
    super();
    this.clientId = process.env.CLIENT_HOMESECURITY_ID;
    this.serverIp = process.env.WISENET_SERVER_IP;
    this.serverPort = process.env.WISENET_SERVER_PORT;
    this.username = process.env.WISENET_SERVER_USERNAME;
    this.password = process.env.WISENET_SERVER_PASSWORD;
    this.token = token;

    this.url = `wss://${this.serverIp}:${this.serverPort}/ec2/transactionBus/websocket`;
    this.wsConnection = null;
    this.RECONNECT_DELAY = 5000;
    this.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    this.reconnectAttempts = 0;
    this.lastNotificationStage = 0;
  }

  connect() {
    this.wsConnection = new WebSocket(this.url, {
      headers: { Authorization: `Bearer ${this.token}` },
      rejectUnauthorized: false,
    });

    this.wsConnection.on("open", () => {
      const msg = `[${this.clientId}] WebSocket connected to ${this.serverIp}:${this.serverPort}`;
      logger.info(msg);
      sendEmail(msg);
      handleAsana(msg);
      this.reconnectAttempts = 0;
      this.lastNotificationStage = 0;
    });

    this.wsConnection.on("message", (message) => {
      (async () => {
        try {
          await handleIncomingMessage(this.serverIp, this.clientId, message);
        } catch (error) {
          const msg = `[${this.clientId}] Error processing message from ${this.serverIp}: ${error.message}`;
          logger.error(msg);
          sendEmail(msg);
        }
      })();
    });

    this.wsConnection.on("close", (code, reason) => {
      const msg = `[${this.clientId}] WebSocket closed on ${this.serverIp}. Code: ${code}, Reason: ${reason}`;
      logger.warn(msg);
      this.handleReconnectionNotifications(msg);
      this.scheduleReconnect();
    });

    this.wsConnection.on("error", (error) => {
      const msg = `[${this.clientId}] WebSocket error on ${this.serverIp}: ${error}`;
      logger.error(msg);
      this.handleReconnectionNotifications(msg);
      this.wsConnection.close();
    });
  }

  handleReconnectionNotifications(msg) {
    this.reconnectAttempts++;

    const stages = [1, 50, 120, 360]; // 0s, ~4min, 10min, 30min
    const stageReached = stages.findIndex(
      (limit, index) =>
        this.reconnectAttempts === limit && this.lastNotificationStage < index,
    );

    if (stageReached !== -1) {
      sendEmail(msg);
      handleAsana(msg);
      this.lastNotificationStage = stageReached;
    }
  }

  scheduleReconnect() {
    setTimeout(() => this.connect(), this.RECONNECT_DELAY);
  }
}

async function main() {
  const tokenInstance = new TokenManager();
  const token = await tokenInstance.getToken();
  const wsClient = new WebSocketClient(token);
  wsClient.connect();
}

main().catch((err) => {
  const msg = `[MAIN] Critical failure: ${err.message}`;
  logger.error(msg);
  handleAsana(msg);
  sendEmail(msg);
});
