import dotenv from "dotenv";
dotenv.config();
import WebSocket from "ws";
import EventEmitter from "events";
import { logger } from "./logger.js";
import sendEmail from "./emailManager.js";
import handleIncomingMessage from "./handleIncomingMessage.js";
import handleAsana from "./AsanaManager.js";
import { pollServers } from "./serversDbPoller.js";
import handleToken from "./tokenManager.js";

const activeConnections = new Map();

class WebSocketClient extends EventEmitter {
  constructor(serverConfig, token) {
    super();
    this.clientId = serverConfig.clientId;
    this.serverId = serverConfig.serverId;
    this.token = token;
    this.serverName = serverConfig.serverName;
    this.url = `wss://${this.serverId}.relay.vmsproxy.com/ec2/transactionBus/websocket`;
    this.wsConnection = null;
    this.RECONNECT_DELAY = 10000;
    this.reconnectAttempts = 0;
    this.lastNotificationStage = 0;
    this.permanentlyFailed = false;
    this.lastNotificationTime = 0;
  }

  connect() {
    if (this.permanentlyFailed) return;

    this.wsConnection = new WebSocket(this.url, {
      headers: { Authorization: `Bearer ${this.token}` },
      rejectUnauthorized: false,
    });

    this.wsConnection.on("open", () => {
      const msg = `[${this.serverName}] [${this.clientId}] WebSocket connected to ${this.url}`;
      logger.info(msg);
      sendEmail(msg);
      handleAsana(msg);
      this.reconnectAttempts = 0;
      this.lastNotificationStage = 0;
      this.lastNotificationTime = 0;
    });

    this.wsConnection.on("message", async (message) => {
      try {
        await handleIncomingMessage(
          this.serverId,
          this.clientId,
          this.serverName,
          message,
        );
      } catch (error) {
        const msg = `[${this.serverName}] [${this.clientId}] Error processing message: ${error.message}`;
        logger.error(msg);
        sendEmail(msg);
      }
    });

    this.wsConnection.on("close", (code, reason) => {
      const msg = `[${this.serverName}] [${this.clientId}] WebSocket closed. Code: ${code}, Reason: ${reason}`;
      logger.warn(msg);
      this.handleReconnectionNotifications(msg);
      this.scheduleReconnect();
    });

    this.wsConnection.on("error", (error) => {
      const msg = `[${this.serverName}] [${this.clientId}] WebSocket error: ${error}`;
      logger.error(msg);
      if (error.message.includes("403")) {
        this.permanentlyFailed = true;
        logger.warn(
          `[${this.serverName}] [${this.clientId}] Forbidden (403) – will not retry.`,
        );
      } else {
        this.handleReconnectionNotifications(msg);
        this.wsConnection.close();
      }
    });
  }

  handleReconnectionNotifications(msg) {
    this.reconnectAttempts++;

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (
      this.lastNotificationTime === 0 ||
      now - this.lastNotificationTime >= ONE_DAY
    ) {
      sendEmail(msg);
      handleAsana(msg);
      this.lastNotificationTime = now;
    }

    const stages = [1, 50, 120, 360];
    const stageReached = stages.findIndex(
      (limit, index) =>
        this.reconnectAttempts === limit && this.lastNotificationStage < index,
    );
    if (stageReached !== -1) {
      this.lastNotificationStage = stageReached;
    }
  }

  scheduleReconnect() {
    if (this.permanentlyFailed) return;
    setTimeout(() => this.connect(), this.RECONNECT_DELAY);
  }

  close() {
    this.wsConnection?.close();
  }
}

async function connectToServer(serverId, config) {
  try {
    const token = await handleToken(
      config.serverId,
      config.serverUsername,
      config.serverPassword,
      config.serverName,
    );

    if (token) {
      const client = new WebSocketClient(config, token);
      activeConnections.set(serverId, client);
      client.connect();
    }
  } catch (error) {
    const msg = `[${serverId}] Token error: ${error.message}`;
    logger.error(msg);
    sendEmail(msg);
  }
}

function disconnectRemovedServers(newServerList) {
  const newIds = newServerList.map((s) => s.serverId);
  for (const id of activeConnections.keys()) {
    if (!newIds.includes(id)) {
      logger.info(`[${id}] Server removed from DB, closing connection.`);
      activeConnections.get(id).close();
      activeConnections.delete(id);
    }
  }
}

function updateConnections(newServers) {
  disconnectRemovedServers(newServers);

  for (const server of newServers) {
    const { serverId, ...config } = server;
    if (!activeConnections.has(serverId)) {
      connectToServer(serverId, server);
    }
  }
}

async function main() {
  try {
    await pollServers(60000, updateConnections);
  } catch (err) {
    const msg = `[MAIN] Critical failure: ${err.message}`;
    logger.error(msg);
    sendEmail(msg);
    handleAsana(msg);
  }
}

main();

setInterval(() => {}, 1000 * 60 * 60); // keep alive
