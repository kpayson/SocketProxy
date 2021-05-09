FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 4444
ENTRYPOINT ["node", "server.js"]