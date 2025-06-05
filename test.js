import fetch from "node-fetch";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // allow relay cert

const relayHost = "1bd945df-1fa3-4318-a0f9-92c9bea2cfd1.relay.vmsproxy.com";
const username = "technic@homesecurity.ch";
const password = "your_password_here";

const loginViaRelay = async () => {
  const response = await fetch(`https://${relayHost}/rest/v3/login/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  return data.token;
};

loginViaRelay()
  .then((token) => console.log("Token:", token))
  .catch(console.error);
