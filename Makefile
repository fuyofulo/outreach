SHELL := /bin/zsh

.PHONY: install dev db-up db-wait db-push db-seed build lint clean

install:
	@test -d node_modules || npm install
	@test -f .env || cp .env.example .env

db-up:
	docker compose up -d db

db-wait:
	until docker compose exec -T db pg_isready -U outreach -d outreach >/dev/null 2>&1; do sleep 1; done

db-push: install db-up db-wait
	npm run prisma:generate
	npm run db:push

db-seed: db-push
	npm run db:seed

dev: db-seed
	npm run dev

build: db-push
	npm run build

lint: install
	npm run lint

clean:
	docker compose down
