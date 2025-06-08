FROM node:20-alpine

ENV TZ=Europe/Zurich

RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Europe/Zurich /etc/localtime && \
    echo "Europe/Zurich" > /etc/timezone

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD ["node", "index.js"]
