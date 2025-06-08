import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { logger } from "./logger.js";
import sendEmail from "./emailManager.js";

const username = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME);
const password = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD);
const uri = `mongodb://${username}:${password}@wisenet-db:27017/wisenet?authSource=admin`;




const client = new MongoClient(uri);
let cachedServers = [];

export const pollServers = async (interval = 5000, onChange) => {
  try {
    await client.connect();
    logger.info("Connected to MongoDB container");

    const db = client.db("wisenet");
    const collection = db.collection("servers");

    const checkForUpdates = async () => {
      try {
        const servers = await collection.find().toArray();

        if (!servers.length) {
          logger.warn("Servers collection found but empty.");
          return;
        }

        const updated =
          JSON.stringify(servers) !== JSON.stringify(cachedServers);
        if (updated) {
          cachedServers = servers;
          logger.info("Servers list updated.");
          onChange(servers);
        }
      } catch (err) {
        const msg = `Polling error: ${err.message}`;
        logger.error(msg);
        sendEmail(msg);
      }
    };

    await checkForUpdates();
    setInterval(checkForUpdates, interval);
  } catch (err) {
    const msg = `MongoDB connect failed: ${err.message}`;
    logger.error(msg);
    sendEmail(msg);
  }
};
