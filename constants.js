//export const USERNAME = process.env.USERNAME;
//export const PASSWORD = process.env.PASSWORD;
//https://10.242.144.238:7001
const serverIp = "10.242.144.238";
const serverPort = "7001";
export const WISENET_USERNAME = "admin";
export const WISENET_PASSWORD = "Tech@Home15!";
export const API_SERVER_URL = `https://${serverIp}:${serverPort}/`;
export const WEBSOCKET_URL = `wss://${serverIp}:${serverPort}/ec2/transactionBus/websocket`;
export const SESSION_ENDPOINT = "rest/v3/login/sessions";
export const GET_DEVICES_ENDPOINT = "rest/v3/devices";
export const SAVE_EVENT_ENDPOINT = "ec2/saveEventRule";
export const REMOVE_EVENT_ENDPOINT = "ec2/removeEventRule";
export const GET_EVENTS_ENDPOINT = "ec2/getEventRules";
export const BROADCASTING_URL = `${API_SERVER_URL}api/createEvent`;

// Create an instance of https.Agent to ignore SSL errors
