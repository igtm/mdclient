.DEFAULT_GOAL := help

.PHONY: help build-wasm zip
help:
	@grep -E '^[a-z0-9A-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build-wasm: ## build wasm
	wasm-pack build --target web --out-dir chrome-extension-public/pages/pkg

zip: ## zip for distribution
	zip -r package.zip chrome-extension-public
