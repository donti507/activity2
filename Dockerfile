FROM node:20-slim

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
# Use npm install (works whether or not lockfile exists)
RUN npm install --production --no-audit --no-fund

# Copy source
COPY . .

# Build client and bundle server
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
