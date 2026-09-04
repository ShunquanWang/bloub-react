import { strCamelCase } from '@/str/str-camel-case.js';

describe('should test the main file', () => {
  it('should test the main file', () => {
    expect(strCamelCase('My Name')).toBe('myName');
  });
});
