describe('bloub-react', () => {
  it('exports BloubBot as the public component', async () => {
    const mod = await import('../src/index');
    expect(mod.BloubBot).toBeTruthy();
    expect(mod.SEQUENCE.length).toBe(14);
    expect('BloubApp' in mod).toBe(false);
    expect('BotEngine' in mod).toBe(false);
    expect('parseCycles' in mod).toBe(false);
    expect('HUMEURS' in mod).toBe(false);
    expect('tourLook' in mod).toBe(false);
    expect('RAYON' in mod).toBe(false);
  });
});
