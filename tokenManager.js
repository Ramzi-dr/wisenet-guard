import axios from "axios";
import https from "https";
import { logger } from "./logger.js";

class TokenManager {
  constructor() {
    this.serverIp = process.env.WISENET_SERVER_IP;
    this.serverPort = process.env.WISENET_SERVER_PORT;
    this.apiUrl = `https://${this.serverIp}:${this.serverPort}/${process.env.SESSION_ENDPOINT}`;
    this.username = process.env.WISENET_SERVER_USERNAME;
    this.password = process.env.WISENET_SERVER_PASSWORD;
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
        { httpsAgent },
      );

      this.token = response.data.token;
      this.expiresIn = response.data.expiresInS;
      this.tokenExpirationTime = Date.now() + this.expiresIn * 1000;

      logger.info(
        `Token valid until: ${new Date(
          this.tokenExpirationTime,
        ).toISOString()}`,
      );

      return this.token;
    } catch (error) {
      console.error(
        "Error refreshing token:",
        error.response ? error.response.data : error.message,
      );
      this.token = null;
      throw new Error("Unable to refresh token");
    }
  };
}

export default TokenManager;
