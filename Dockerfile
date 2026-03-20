FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Expose frontend build-time env vars to Vite during Docker build.
ARG VITE_SITE_URL
ARG VITE_PLAUSIBLE_DOMAIN
ARG VITE_PLAUSIBLE_SRC
ARG VITE_FORMSPREE_ENDPOINT
ARG VITE_BOT_URL
ARG VITE_BOT_WS_URL
ENV VITE_SITE_URL=$VITE_SITE_URL \
    VITE_PLAUSIBLE_DOMAIN=$VITE_PLAUSIBLE_DOMAIN \
    VITE_PLAUSIBLE_SRC=$VITE_PLAUSIBLE_SRC \
    VITE_FORMSPREE_ENDPOINT=$VITE_FORMSPREE_ENDPOINT \
    VITE_BOT_URL=$VITE_BOT_URL \
    VITE_BOT_WS_URL=$VITE_BOT_WS_URL
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "node -e \"const fs=require('fs');const cfg={VITE_SITE_URL:process.env.VITE_SITE_URL||'',VITE_PLAUSIBLE_DOMAIN:process.env.VITE_PLAUSIBLE_DOMAIN||'',VITE_PLAUSIBLE_SRC:process.env.VITE_PLAUSIBLE_SRC||'',VITE_FORMSPREE_ENDPOINT:process.env.VITE_FORMSPREE_ENDPOINT||'',VITE_BOT_URL:process.env.VITE_BOT_URL||'',VITE_BOT_WS_URL:process.env.VITE_BOT_WS_URL||''};fs.writeFileSync('./dist/runtime-config.js','window.__APP_CONFIG__='+JSON.stringify(cfg)+';');\" && serve dist -l ${PORT:-3000}"]
