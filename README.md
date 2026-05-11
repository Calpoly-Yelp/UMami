# UMami

## Deployment

### Live App

🌐 [UMami](https://thankful-hill-0f3846d10.7.azurestaticapps.net)

### CI/CD Status

![Frontend Deploy](https://github.com/Calpoly-Yelp/UMami/actions/workflows/azure-static-web-apps-thankful-hill-0f3846d10.yml/badge.svg)
![Backend Deploy](https://github.com/Calpoly-Yelp/UMami/actions/workflows/main_umami-api-calpoly.yml/badge.svg)
![CI Testing](https://github.com/Calpoly-Yelp/UMami/actions/workflows/ci-testing.yml/badge.svg)

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
| Frontend | 59.15% |   58.2%    |  51.53%   |  49.44%  |
| Backend  |  100%  |    100%    |   100%    |   100%   |

<!-- COVERAGE-END -->
