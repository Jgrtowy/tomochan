FROM oven/bun:1 AS base
WORKDIR /app

COPY bun.lockb package.json tsconfig.json ./
COPY src/ /app/src/

RUN bun install --frozen-lockfile

RUN chmod -R 777 /app
ENV NODE_ENV=production
USER bun

ENTRYPOINT [ "bun", "run", "." ]