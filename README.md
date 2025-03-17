# TomoChan

Discord bot build as a fun project for my friend that changes his nickname to `Tomo<something>wsky` with one of those stored in a database.

## Development

- Install bun

```bash
# Linux & macOS
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

- Change `.env.example` to `.env` and fill out blank fields

- Push database schema

```bash
bun db:push
```

- Run the bot

```bash
bun dev
```

