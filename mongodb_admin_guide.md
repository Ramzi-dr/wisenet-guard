# MongoDB Admin Quick Guide (Docker + mongosh)

## 🔐 1. Connect to MongoDB (via Docker)

```bash
docker exec -it wisenet-guard-db mongosh -u admin -p 'dbPassword' --authenticationDatabase admin
```

> Replace `wisenet-guard-db` with your container name if different.

---

## 🧭 2. Switch to Correct Database

```js
use wisenet
```

> `"wisenet"` is defined in Docker under:
>
> ```yaml
> MONGO_INITDB_DATABASE: wisenet
> ```

---

## ➕ 3. Insert New Server

```js
db.servers.insertOne({
  serverName: "Hetzner_Ramzi_Demo00",
  serverId: "4bbd8ca3-c88a-4016-85ec-e36457fb4656",
  clientId: "1234",
  serverUsername: "admin",
  serverPassword: "password",
});
```

---

## 🛠️ 4. Update Server

```js
db.servers.updateOne(
  { serverName: "Hetzner_Ramzi_Demo00" },
  {
    $set: {
      serverUsername: "newUsername",
      serverPassword: "newPassword",
    },
  },
);
```

---

## ❌ 5. Delete Server

```js
db.servers.deleteOne({ serverId: "4bbd8ca3-c88a-4016-85ec-e36457fb4656" })
or
db.servers.deleteOne({ serverName: "Hetzner_Ramzi_Demo00" })
```

---

## 🔍 6. View All Servers

```js
db.servers.find().pretty();
```
