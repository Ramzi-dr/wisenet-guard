import axios from "axios";
import https from "https";
import { logger } from "./logger.js";

class TokenManager {
  constructor({ serverId, username, password, serverName }) {
    this.serverId = serverId;
    this.apiUrl = `https://${this.serverId}.relay.vmsproxy.com/${process.env.SESSION_ENDPOINT}`;
    this.username = username;
    this.password = password;
    this.serverName = serverName;
    this.token = null;
    this.expiresIn = null;
    this.tokenExpirationTime = null;
  }

  getToken = async () => {
    return this.token && this.tokenExpirationTime > Date.now()
      ? this.token
      : await this.refreshToken();
  };

  refreshToken = async () => {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          username: this.username,
          password: this.password,
        },
        {
          httpsAgent,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      this.token = response.data.token;
      this.expiresIn = response.data.expiresInS;
      this.tokenExpirationTime = Date.now() + this.expiresIn * 1000;

      logger.info(
        `[${this.serverName}] Token valid until: ${new Date(
          this.tokenExpirationTime,
        ).toISOString()}`,
      );

      return this.token;
    } catch (error) {
      const msg = `[${this.serverName}] Error refreshing token: ${
        error.response?.data || error.message
      }`;
      logger.error(msg);
      this.token = null;
      throw new Error("Unable to refresh token");
    }
  };
}

async function handleToken(serverId, username, password, serverName) {
  const instance = new TokenManager({
    serverId,
    username,
    password,
    serverName,
  });
  return await instance.getToken();
}

export default handleToken;
