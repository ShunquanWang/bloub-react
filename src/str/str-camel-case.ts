/**
 * @description
 * Convert string to camel case format
 *
 * @example
 * ``` ts
 * strCamelCase('--foo-bar--');
 * // => fooBar
 * strCamelCase('__FOO_ BAR__');
 * // => fooBar
 * strCamelCase('__FOO_- BAR__');
 * // => fooBar
 * ```
 *
 * @param str The string to be converted
 *
 * @docsCategory preference/utils/string
 * @codeFilter str-camel-case
 */
export const strCamelCase = (str: string) => {
  return (str || '')
    .split(/[\s-_]+/)
    .filter((s) => !!s)
    .map((word, index) => {
      // If it is the first word make sure to lowercase all the chars.
      if (index === 0) {
        return word.toLowerCase();
      }
      // If it is not the first word only upper case the first char and lowercase the rest.
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};
