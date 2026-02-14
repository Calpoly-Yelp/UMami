# UMami

## Running Prettier:

npm run format

## Running Linter

npm run lint
npm run lint:fix

## Running Frontend

npm run frontend:dev

## Running Backend

npm run backend:dev

## Running Frontend+Backend

npm run dev

## Formatting + Linting (Using Prettier and ESLint)

### One-time setup

1. Install dependencies from the repo root:
   - `npm install`
   - `npm --prefix frontend install`
   - `npm --prefix backend install`

2. Install VS Code extensions:
   - **ESLint** (dbaeumer.vscode-eslint)
   - **Prettier – Code formatter** (esbenp.prettier-vscode)

3. VS Code will use the repo’s `.vscode/settings.json` to:
   - format on save (Prettier)
   - auto-fix lint issues on save (ESLint)
