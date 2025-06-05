import sendEmail from "./emailManager.js";
import { logger } from "./logger.js";
import handleAsana from "./AsanaManager.js";

const cameraStatusMap = new Map();
const cameraEventTimestamps = new Map();

const cameraEvents = async (message) => {
  const { command, params, serverIp, clientId } = message;

  console.log("command", command);

  if (!params?.id || !params?.status) return;

  const cameraId = params.id;
  const status = params.status;
  const key = `${serverIp}_${cameraId}`;
  const statusKey = `${key}_${status}`;
  const now = Date.now();

  // Deduplicate same status within 5s
  if (cameraEventTimestamps.get(statusKey) > now - 5000) return;
  cameraEventTimestamps.set(statusKey, now);

  const previousStatus = cameraStatusMap.get(key);
  cameraStatusMap.set(key, status);

  switch (status) {
    case "Offline": {
      const messageText = `[${clientId}] Camera ${cameraId} is Offline on ${serverIp}`;
      logger.warn(messageText);
      handleAsana(messageText);
      sendEmail(messageText);
      break;
    }

    case "Online": {
      if (previousStatus === "Offline") {
        const messageText = `[${clientId}] Camera ${cameraId} is now Online (was Offline) on ${serverIp}`;
        logger.info(messageText);
        handleAsana(messageText);
        sendEmail(messageText);
      } else {
        logger.info(
          `[${clientId}] Camera ${cameraId} is Online on ${serverIp}`,
        );
      }
      break;
    }

    case "Recording": {
      logger.info(
        `[${clientId}] Camera ${cameraId} is Recording on ${serverIp}`,
      );
      break;
    }

    default: {
      logger.info(
        `[${clientId}] Camera ${cameraId} has unknown status "${status}" on ${serverIp}`,
      );
    }
  }
};

export default cameraEvents;
