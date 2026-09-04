'use client';

import {
  BloubBot,
  DEFAULT_COLOR,
  DEFAULT_EXPRESSION,
  DEFAULT_SHAPE,
  type StateId,
} from 'bloub-react';

export type BotTileProps = {
  label: string;
  selected: boolean;
  frozenAt: number;
  state?: StateId;
  shape?: string;
  color?: string;
  expression?: string;
  size?: number;
  onClick?: () => void;
};

/**
 * Vignette cliquable : un bot fige, son nom dessous, une bordure quand elle est
 * retenue. Sert aux formes, aux expressions et aux animations.
 */
export function BotTile({
  label,
  selected,
  frozenAt,
  state = 'idle',
  shape = DEFAULT_SHAPE,
  color = DEFAULT_COLOR,
  expression = DEFAULT_EXPRESSION,
  size = 60,
  onClick,
}: BotTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center rounded-xl border-2 p-1 transition ${
        selected
          ? 'border-[var(--ink)]'
          : 'border-transparent hover:border-[var(--line)]'
      }`}
      aria-label={label}
      aria-pressed={selected}
    >
      <BloubBot
        state={state}
        size={size}
        shape={shape}
        color={color}
        expression={expression}
        frozenAt={frozenAt}
      />
      <span className="text-center text-xs leading-tight text-[var(--muted)]">
        {label}
      </span>
    </button>
  );
}

export default BotTile;
