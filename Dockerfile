FROM oven/bun:1 AS base
WORKDIR /app

COPY bun.lockb package.json tsconfig.json ./
COPY src/ ./src/

RUN bun install

RUN chmod -R 777 /app
ENV NODE_ENV=production
USER bun

ENTRYPOINT [ "bun", "run", "./src/index.ts" ]