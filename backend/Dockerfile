FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/src ./src
COPY data ./data

EXPOSE 3001

CMD ["sh", "-c", "npm run migrate && npm run start"]
