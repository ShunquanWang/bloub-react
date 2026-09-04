# bloub-react

[English](./README.md) · [中文](./README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/bloub-react.svg)](https://www.npmjs.com/package/bloub-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/ShunquanWang/bloub-react/actions/workflows/ci-integrity.yml/badge.svg)](https://github.com/ShunquanWang/bloub-react/actions/workflows/ci-integrity.yml)

React component library for the animated [bloub](https://github.com/jeremy-prt/bloub) SVG avatar — one morphing body shape, independent eye shapes, no animation library.

![Bloub demo](./public/bloub.mp4)

## Features

- **`BloubBot`** — drop-in React avatar with live playback or frozen frames
- **14 measured states** — morph timings and silhouettes taken from the reference video
- **Clock-free engine** — `engine.sample(t)` is a pure function of time (pause, seek, test-friendly)
- **Studio website** — customise look, edit animation timelines, export SVG / PNG / GIF / MP4
- **i18n** — French, English, and Chinese in the studio

## Installation

```bash
npm install bloub-react
# or
yarn add bloub-react
# or
pnpm add bloub-react
```

Requires **React 19** (`react` / `react-dom` as peer dependencies).

## Usage

```tsx
import { BloubBot } from 'bloub-react';
import { useState } from 'react';

export function App() {
  const [block, setBlock] = useState(0);
  const [playing, setPlaying] = useState(true);

  return (
    <>
      {/* Live playback, follow the cursor */}
      <BloubBot
        block={block}
        onBlockChange={setBlock}
        playing={playing}
        onPlayingChange={setPlaying}
        follow
      />

      {/* Single frozen frame (thumbnails, boards) */}
      <BloubBot state="orbit" size={120} frozenAt={1.2} />
    </>
  );
}
```

### Props (overview)

| Prop | Description |
| --- | --- |
| `size` | Render size |
| `shape` / `color` / `expression` / `paper` | Appearance |
| `cycle` | Timeline blocks to play |
| `block` / `state` / `playing` / `elapsed` | Controlled playback |
| `frozenAt` | Absolute time (seconds); disables the RAF loop |
| `follow` / `gaze` | Cursor follow and scripted look |

See [`BloubBot.tsx`](./packages/bloub-react/src/BloubBot.tsx) for full JSDoc. Package README: [`packages/bloub-react`](./packages/bloub-react/README.md).

## Repository structure

```
packages/bloub-react/   # publishable React library
website/                # Next.js studio demo
```

## Development

```bash
yarn install
yarn workspace bloub-react-website dev   # studio at localhost
```

```bash
yarn workspace bloub-react test-unit
yarn workspace bloub-react-website test
yarn g:typecheck
yarn g:build
```

### Releasing

Publishing uses [Changesets](https://github.com/changesets/changesets) on `main`:

1. `yarn g:changeset`
2. Merge to `main` → CI opens a **Version packages** PR
3. Merge that PR → publishes `bloub-react` to npm (`NPM_TOKEN` required)

```bash
yarn workspace bloub-react build
yarn workspace bloub-react pack --dry-run
```

## Acknowledgments

Built on **[bloub](https://github.com/jeremy-prt/bloub)** by [jeremy-prt](https://github.com/jeremy-prt) — frame-by-frame measurements, morph engine, and studio UX all originate there.

If this React port helps you, please also star the [upstream project](https://github.com/jeremy-prt/bloub).

## License

[MIT](./LICENSE)
