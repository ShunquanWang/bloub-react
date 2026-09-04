# bloub-react

React component library that exports `BloubBot` — an animated SVG avatar (React port of [bloub](https://github.com/jeremy-prt/bloub)).

**Repository:** [https://github.com/ShunquanWang/bloub-react](https://github.com/ShunquanWang/bloub-react)

## Install

```bash
npm install bloub-react
# or
yarn add bloub-react
```

Peer dependencies: `react` and `react-dom` ^19.

```tsx
import { BloubBot } from 'bloub-react';

export function App() {
  return <BloubBot size={320} follow />;
}
```

## License

[MIT](./LICENSE.md) © Shunquan Wang
