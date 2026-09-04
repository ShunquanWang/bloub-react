# Contribution Guidelines

Thanks for contributing to [bloub-react](https://github.com/ShunquanWang/bloub-react)!

## Branches

- `main` — default branch for fixes and small improvements

Larger features can use a short-lived topic branch and open a pull request against `main`.

## Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org).

```
type(scope): message in present tense
```

Common types: `feat`, `fix`, `docs`, `perf`, `style`, `refactor`, `test`, `chore`.

Useful scopes: `bloub-react`, `website`, or omit scope for root tooling.

You can use Commitizen locally:

```bash
yarn g:cz
```

## Development

```bash
yarn install
yarn workspace bloub-react-website dev
yarn workspace bloub-react test-unit
yarn workspace bloub-react-website test
yarn workspace bloub-react typecheck
yarn workspace bloub-react-website typecheck
```

## Pull requests

1. Open an issue first for non-trivial changes when possible.
2. Keep PRs focused.
3. Ensure tests and typecheck pass.
