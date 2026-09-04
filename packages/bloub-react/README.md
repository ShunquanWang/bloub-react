# bloub-react

[![npm](https://img.shields.io/npm/v/bloub-react.svg)](https://www.npmjs.com/package/bloub-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE.md)

React component for the animated [bloub](https://github.com/jeremy-prt/bloub) SVG avatar — one morphing body shape, independent eye shapes, no animation library.

React port of [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub). Source monorepo: [ShunquanWang/bloub-react](https://github.com/ShunquanWang/bloub-react).

## Install

```bash
npm install bloub-react
# or
yarn add bloub-react
# or
pnpm add bloub-react
```

Peer dependencies: **React 19** (`react` / `react-dom`).

## Quick start

```tsx
import { BloubBot } from 'bloub-react';

export function App() {
  return <BloubBot size={320} follow />;
}
```

### Live playback (controlled)

```tsx
import { BloubBot } from 'bloub-react';
import { useState } from 'react';

export function Player() {
  const [block, setBlock] = useState(0);
  const [playing, setPlaying] = useState(true);

  return (
    <BloubBot
      block={block}
      onBlockChange={setBlock}
      playing={playing}
      onPlayingChange={setPlaying}
      follow
    />
  );
}
```

### Frozen frame (thumbnails / boards)

Omit the animation loop and render one exact time:

```tsx
<BloubBot state="orbit" size={120} frozenAt={1.2} />
```

`engine.sample(t)` is a pure function of time, so still frames are reproducible.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `320` | SVG side length (CSS px) |
| `shape` | `string` | `"cercle"` | Body shape id (`SHAPES`) |
| `color` | `string` | `"encre"` | Ink / fill id (`COLORS`) |
| `expression` | `string` | `"neutre"` | Rest face id (`EXPRESSIONS`) |
| `paper` | `string` | `"#f9f9f9"` | Background CSS color |
| `cycle` | `Block[]` | default montage | Timeline blocks (`state` + `duration`) |
| `block` | `number` | `0` | Controlled block index |
| `onBlockChange` | `(n) => void` | — | Block change callback |
| `state` | `StateId` | `"idle"` | Controlled / fixed state |
| `onStateChange` | `(s) => void` | — | State change callback |
| `playing` | `boolean` | `false` | Advance through `cycle` |
| `onPlayingChange` | `(p) => void` | — | Playing change callback |
| `elapsed` | `number` | `0` | Time within current block (s) |
| `onElapsedChange` | `(t) => void` | — | Elapsed callback |
| `frozenAt` | `number` | — | Freeze at absolute time (s); no RAF |
| `follow` | `boolean` | `false` | Eyes track the pointer |
| `gaze` | `GazeScript \| null` | `null` | Scripted look `(t) => Look` |
| `className` / `style` | — | — | Root `<svg>` |
| `aria-label` | `string` | `"Animated bot avatar"` | Accessible name |

Full JSDoc: [`src/BloubBot.tsx`](./src/BloubBot.tsx).

## Imperative API (`ref`)

```tsx
import { BloubBot, type BloubBotHandle } from 'bloub-react';
import { useRef } from 'react';

function Exportable() {
  const ref = useRef<BloubBotHandle>(null);

  return (
    <BloubBot
      ref={ref}
      // seek(index, offsetSeconds?) / rendAt(absoluteSeconds)
    />
  );
}
```

## Catalogs & helpers

Also exported from `bloub-react`:

- **States:** `STATES`, `STATE_BY_ID`, `SEQUENCE`, `POSES`, `StateId`
- **Skins:** `SHAPES`, `COLORS`, `SHAPE_BY_ID`, `COLOR_BY_ID`
- **Expressions:** `EXPRESSIONS`, `EXPRESSION_BY_ID`
- **Cycles:** `defaultCycle`, `makeBlock`, `totalDuration`, `Block`, …

```tsx
import { SHAPES, COLORS, EXPRESSIONS, SEQUENCE } from 'bloub-react';
```

## Acknowledgments

Built on **[bloub](https://github.com/jeremy-prt/bloub)** by [jeremy-prt](https://github.com/jeremy-prt). If this package helps you, please also star the [upstream project](https://github.com/jeremy-prt/bloub).

## License

[MIT](./LICENSE.md) © [Shunquan Wang](https://github.com/ShunquanWang)

Not affiliated with x.ai. Recreates the visual behaviour of their bot avatar as an exercise; “Grok” and “x.ai” belong to their owners.
