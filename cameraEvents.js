import sendEmail from "./emailManager.js";
import { logger } from "./logger.js";
import handleAsana from "./AsanaManager.js";

const cameraStatusMap = new Map();
const cameraEventTimestamps = new Map();

const cameraEvents = async (message) => {
  const { command, params, serverId, clientId, serverName } = message;

  if (!params?.id || !params?.status) return;

  const cameraId = params.id;
  const status = params.status;
  const key = `${serverId}_${cameraId}`;
  const statusKey = `${key}_${status}`;
  const now = Date.now();

  if (cameraEventTimestamps.get(statusKey) > now - 5000) return;
  cameraEventTimestamps.set(statusKey, now);

  const previousStatus = cameraStatusMap.get(key);
  cameraStatusMap.set(key, status);

  switch (status) {
    case "Offline": {
      const messageText = `[${serverName}] [${clientId}] Camera ${cameraId} is Offline on ${serverId}`;
      logger.warn(messageText);
      handleAsana(messageText);
      sendEmail(messageText);
      break;
    }

    case "Online": {
      if (previousStatus === "Offline") {
        const messageText = `[${serverName}] [${clientId}] Camera ${cameraId} is now Online (was Offline) on ${serverId}`;
        logger.info(messageText);
        handleAsana(messageText);
        sendEmail(messageText);
      } else {
        logger.info(
          `[${serverName}] [${clientId}] Camera ${cameraId} is Online on ${serverId}`,
        );
      }
      break;
    }

    case "Recording": {
      logger.info(
        `[${serverName}] [${clientId}] Camera ${cameraId} is Recording on ${serverId}`,
      );
      break;
    }

    default: {
      logger.info(
        `[${serverName}] [${clientId}] Camera ${cameraId} has unknown status "${status}" on ${serverId}`,
      );
    }
  }
};

export default cameraEvents;
