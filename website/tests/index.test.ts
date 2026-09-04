import { describe, expect, it } from 'vitest';
import * as bloub from '@/bloub';

describe('website smoke', () => {
  it('exports the bloub studio entry', () => {
    expect(bloub).toBeTruthy();
  });
});
