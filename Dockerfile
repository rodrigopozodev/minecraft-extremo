FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data

WORKDIR /app

COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public/ ./public/

RUN mkdir -p /app/data && chown node:node /app/data

USER node

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["node", "server.js"]
