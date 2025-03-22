# TomoChan

Discord bot build as a fun project for my friend that changes his nickname to `Tomo<something>owsky` with one of those stored in a database.

## development

Install bun

```bash
# Linux & macOS
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

Copy `.env.example` contents to `.env` and fill out blank fields

Push database schema

```bash
bun db:push
```

Run the bot

```bash
bun dev
```

## hosting

Install docker or docker desktop.

Use example `docker-compose.yml` file as a template and adjust it to your needs

Run the bot

```bash
docker compose up -d
```

Use bot's `/sql` command and paste contents of `triggers.sql` file.