import { cameraCommands, ignoredCommands } from "./configs/commands.js";
import cameraEvents from "./cameraEvents.js";
import sendEmail from "./emailManager.js";
import { logger } from "./logger.js";

const handleIncomingMessage = async (serverIp, clientId, message) => {
  if (!message) return;

  try {
    const decodedMessage = JSON.parse(message);
    const tran = decodedMessage.tran;
    if (!tran || typeof tran !== "object" || !tran.command) return;

    if (cameraCommands.includes(tran.command)) {
      if (tran.params) {
        cameraEvents({
          clientId,
          serverIp,
          command: tran.command,
          params: tran.params,
        }).catch(console.error);
      }
      return;
    }

    if (ignoredCommands.includes(tran.command)) return;

    console.log("Command not in list:", tran.command);
    if (tran.params) {
      console.log("Params:", tran.params);
    }
  } catch (error) {
    const msg = `Error processing incoming message at server ${serverIp}: ${error.message}`;
    console.error(msg);
    logger.error(msg);
    sendEmail(msg);
  }
};

export default handleIncomingMessage;
