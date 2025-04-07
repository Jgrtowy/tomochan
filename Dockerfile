FROM oven/bun AS build
WORKDIR /app

COPY bun.lockb .
COPY package.json .

ENV NODE_ENV=production
RUN bun install --frozen-lockfile

COPY tsconfig.json .
COPY src ./src

RUN bun build ./src/index.ts --compile --outfile cli

FROM ubuntu:22.04
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl gnupg && \
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
    apt-get update && \
    apt-get -y install doppler

COPY --from=build /app/cli /app/cli

# when using doppler to inject secrets into the container at runtime
CMD ["doppler", "run", "--", "/app/cli"]

# when not using doppler, uncomment the following line to run the cli directly
# CMD ["/app/cli"]