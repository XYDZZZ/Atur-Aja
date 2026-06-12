# ─────────────────────────────────────────────────
#  AturAja Bot — Dockerfile
#  Base image dengan Chromium pre-installed untuk Puppeteer
# ─────────────────────────────────────────────────
FROM node:20-slim

# Install Chromium & dependencies yang dibutuhkan whatsapp-web.js
RUN apt-get update && apt-get install -y \
    ca-certificates \
    chromium \
    fonts-freefont-ttf \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    libgbm1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Beritahu Puppeteer untuk skip download Chromium-nya sendiri
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies dulu (cache layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Folder untuk sesi WA — akan di-mount sebagai volume
RUN mkdir -p /app/.wwebjs_auth

CMD ["node", "index.js"]
