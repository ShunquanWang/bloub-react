# bloub-react

[English](./README.md) · [中文](./README.zh-CN.md)

[![npm](https://img.shields.io/npm/v/bloub-react.svg)](https://www.npmjs.com/package/bloub-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/ShunquanWang/bloub-react/actions/workflows/ci-integrity.yml/badge.svg)](https://github.com/ShunquanWang/bloub-react/actions/workflows/ci-integrity.yml)

动画 SVG 头像 [bloub](https://github.com/jeremy-prt/bloub) 的 React 组件库 —— 一块形变的身体、独立的眼睛形体，不依赖动画库。

## 特性

- **`BloubBot`** — 可直接使用的 React 头像，支持实时播放与冻结帧
- **14 种测量状态** — 形变节奏与轮廓来自参考视频的逐帧测量
- **无时钟引擎** — `engine.sample(t)` 是时间的纯函数，便于暂停、跳转与测试
- **Studio 网站** — 自定义外观、编辑动画时间线，导出 SVG / PNG / GIF / MP4
- **多语言** — Studio 支持法语、英语、中文

## 安装

```bash
npm install bloub-react
# 或
yarn add bloub-react
# 或
pnpm add bloub-react
```

需要 **React 19**（`react` / `react-dom` 为 peer 依赖）。

## 使用

```tsx
import { BloubBot } from 'bloub-react';
import { useState } from 'react';

export function App() {
  const [block, setBlock] = useState(0);
  const [playing, setPlaying] = useState(true);

  return (
    <>
      {/* 实时播放，跟随指针 */}
      <BloubBot
        block={block}
        onBlockChange={setBlock}
        playing={playing}
        onPlayingChange={setPlaying}
        follow
      />

      {/* 冻结单帧（缩略图、状态板） */}
      <BloubBot state="orbit" size={120} frozenAt={1.2} />
    </>
  );
}
```

### Props 概览

| Prop | 说明 |
| --- | --- |
| `size` | 渲染尺寸 |
| `shape` / `color` / `expression` / `paper` | 外观 |
| `cycle` | 播放时间线 |
| `block` / `state` / `playing` / `elapsed` | 受控播放 |
| `frozenAt` | 绝对时间（秒）；关闭 RAF 循环 |
| `follow` / `gaze` | 指针跟随与脚本视线 |

完整 JSDoc 见 [`BloubBot.tsx`](./packages/bloub-react/src/BloubBot.tsx)。包说明：[`packages/bloub-react`](./packages/bloub-react/README.md)。

## 仓库结构

```
packages/bloub-react/   # 可发布的 React 组件库
website/                # Next.js Studio 演示站
```

## 开发

```bash
yarn install
yarn workspace bloub-react-website dev   # 启动 Studio
```

```bash
yarn workspace bloub-react test-unit
yarn workspace bloub-react-website test
yarn g:typecheck
yarn g:build
```

### 发布

在 `main` 上通过 [Changesets](https://github.com/changesets/changesets) 发版：

1. `yarn g:changeset`
2. 合并到 `main` → CI 打开 **Version packages** PR
3. 合并该 PR → 发布 `bloub-react` 到 npm（需配置 `NPM_TOKEN`）

```bash
yarn workspace bloub-react build
yarn workspace bloub-react pack --dry-run
```

## 致谢

本项目基于 **[bloub](https://github.com/jeremy-prt/bloub)**（[jeremy-prt](https://github.com/jeremy-prt)）—— 逐帧测量、形变引擎与 Studio 体验均源自该项目。

若本 React 移植对你有帮助，也请给[上游仓库](https://github.com/jeremy-prt/bloub)点个 Star。

## 许可证

[MIT](./LICENSE)