import { cameraCommands, ignoredCommands } from "./configs/commands.js";
import cameraEvents from "./cameraEvents.js";
import sendEmail from "./emailManager.js";
import { logger } from "./logger.js";

const handleIncomingMessage = async (
  serverId,
  clientId,
  serverName,
  message,
) => {
  if (!message) return;

  try {
    const decodedMessage = JSON.parse(message);
    const tran = decodedMessage.tran;
    if (!tran || typeof tran !== "object" || !tran.command) return;

    if (cameraCommands.includes(tran.command)) {
      if (tran.params) {
        cameraEvents({
          clientId,
          serverId,
          serverName,
          command: tran.command,
          params: tran.params,
        }).catch(console.error);
      }
      return;
    }

    if (ignoredCommands.includes(tran.command)) return;

    logger.info(
      `[${serverName}] [${clientId}] Command not in list:`,
      tran.command,
    );
  } catch (error) {
    const msg = `[${serverName}] [${clientId}] Error processing incoming message at ${serverId}: ${error.message}`;

    logger.error(msg);
    sendEmail(msg);
  }
};

export default handleIncomingMessage;
