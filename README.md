# UMami

## Running Testing:

```console
npm run test
npm run frontend:test
npm run backend:test
```

## Running Test Coverage & Updating README:

```console
npm run test:coverage
node update-coverage.js
```

## Running Prettier:

```console
npm run format
```

## Running Linter

```console
npm run lint
npm run lint:fix
```

## Running Frontend

```console
npm run frontend:dev
```

## Running Backend

```console
npm run backend:dev
```

## Running Frontend+Backend

```console
npm run dev
```

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

## Code Coverage

<!-- Screenshot of Terminal Test Coverage -->

![Coverage Screenshot](assets/coverage-screenshot-frontend.png)
![Coverage Screenshot](assets/coverage-screenshot-backend.png)

<!-- COVERAGE-START -->

| Project  | Lines  | Statements | Functions | Branches |
| :------- | :----: | :--------: | :-------: | :------: |
| Frontend | 63.21% |   62.22%   |  58.73%   |  57.67%  |
| Backend  |  100%  |    100%    |   100%    |   100%   |

<!-- COVERAGE-END -->
