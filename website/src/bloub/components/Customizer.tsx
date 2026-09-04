'use client';

import { COLORS, EXPRESSIONS, SHAPES } from 'bloub-react';
import { t } from '../i18n';
import { BotTile } from './BotTile';

export type CustomizerProps = {
  shape: string;
  onShapeChange: (shape: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  expression: string;
  onExpressionChange: (expression: string) => void;
};

/**
 * Les vignettes sont figees a la meme date que la pose de repos : elles montrent
 * la forme et le visage tels qu'ils apparaitront, pas un aplat abstrait.
 */
const PREVIEW_AT = 1;

export function Customizer({
  shape,
  onShapeChange,
  color,
  onColorChange,
  expression,
  onExpressionChange,
}: CustomizerProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{t('panel.shape')}</h2>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {SHAPES.map((s) => (
          <BotTile
            key={s.id}
            label={t(`shapes.${s.id}`)}
            selected={s.id === shape}
            shape={s.id}
            color={color}
            expression={expression}
            frozenAt={PREVIEW_AT}
            onClick={() => onShapeChange(s.id)}
          />
        ))}
      </div>

      <h2 className="mt-5 text-sm font-semibold">{t('panel.expression')}</h2>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {EXPRESSIONS.map((e) => (
          <BotTile
            key={e.id}
            label={t(`expressions.${e.id}`)}
            selected={e.id === expression}
            shape={shape}
            color={color}
            expression={e.id}
            frozenAt={PREVIEW_AT}
            onClick={() => onExpressionChange(e.id)}
          />
        ))}
      </div>

      <h2 className="mt-5 text-sm font-semibold">{t('panel.color')}</h2>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`flex aspect-square cursor-pointer items-center justify-center rounded-full border-2 transition ${
              c.id === color
                ? 'border-[var(--ink)]'
                : 'border-transparent hover:border-[var(--line)]'
            }`}
            aria-label={t(`colors.${c.id}`)}
            aria-pressed={c.id === color}
            onClick={() => onColorChange(c.id)}
          >
            {/* liseré interne : sinon la pastille creme disparait sur fond clair */}
            <span
              className="block h-[78%] w-[78%] rounded-full ring-1 ring-black/10 ring-inset"
              style={{ background: c.hex }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default Customizer;
