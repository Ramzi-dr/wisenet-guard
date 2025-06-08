GUARD - SYSTEM OVERVIEW
Wisenet Guard is a Docker-based Node.js application that connects to Wisenet servers via their
cloud API using configuration data stored in MongoDB.
It listens to live WebSocket events for server and camera status changes.
NOTIFICATIONS:
- Email alerts when a server or camera goes OFFLINE or ONLINE
- Asana task creation for status changes
ARCHITECTURE:
- MongoDB container (wisenet-guard-db):
 - Runs on Docker
 - Data is only accessible locally via SSH for security
- App container (wisenet-guard):
 - Starts only after DB is ready
 - Loads config from MongoDB
 - Connects to Wisenet cloud WebSocket endpoints
 - Reconnects if configuration is updated in DB
DEPENDENCIES:
To run this system, you must manually provide:
 - .env file (with DB credentials)
 - configs/commands.js
 - configs/asanaInstances.js
CRUD COMMANDS FOR MONGODB (INSIDE CONTAINER):
1. CONNECT TO DB:
docker exec -it wisenet-guard-db mongosh -u admin -p 'dbPassword' --authenticationDatabase
admin
2. SWITCH TO CORRECT DB:
use wisenet
3. ADD SERVER:
db.servers.insertOne({
 serverName: "Hetzner_Ramzi_Demo00",
 serverId: "4bbd8ca3-c88a-4016-85ec-e36457fb4656",
 clientId: "1234",
 serverUsername: "admin",
 serverPassword: "password",
});
4. UPDATE SERVER:
db.servers.updateOne(
 { serverName: "Hetzner_Ramzi_Demo00" },
 { $set: { serverUsername: "newUsername", serverPassword: "newPassword" } }
);
5. DELETE SERVER:
db.servers.deleteOne({ serverId: "4bbd8ca3-c88a-4016-85ec-e36457fb4656" })
6. VIEW ALL:
db.servers.find().pretty();
RUNNING THE PROJECT:
docker compose up --build
