FROM node:20-alpine

WORKDIR /app

# 因為 Root Directory 設為 /backend，所以直接複製當前目錄下的檔案
COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY data ./data

EXPOSE 3001

# 確保啟動時先跑 migrate
CMD ["sh", "-c", "node src/scripts/migrate.js && node src/server.js"]
