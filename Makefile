.DEFAULT_GOAL := all

.PHONY: all
all: ui

.PHONY: ui
ui:
	pnpm format
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm build
