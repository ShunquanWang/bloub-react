/**
 * Public surface of the bot engine: catalogs + playback helpers for BloubBot props.
 * Editor / storage / intro scripts stay in the website package.
 */

export {
  type Block,
  blockAt,
  clampDuration,
  type Cycle,
  defaultCycle,
  makeBlock,
  MAX_BLOCK,
  MIN_BLOCK,
  minDurationOf,
  offsetOf,
  STEP,
  totalDuration,
} from './cycles';
export {
  type BotExpression,
  DEFAULT_EXPRESSION,
  EXPRESSION_BY_ID,
  type ExpressionId,
  EXPRESSIONS,
} from './expressions';
export type { GazeScript } from './gaze';
export {
  COLOR_BY_ID,
  type ColorId,
  COLORS,
  DEFAULT_COLOR,
  DEFAULT_SHAPE,
  SHAPE_BY_ID,
  type ShapeId,
  SHAPES,
} from './skins';
export { POSES, SEQUENCE, STATE_BY_ID, type StateId, STATES } from './states';
