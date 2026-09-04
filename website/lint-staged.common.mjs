import path from 'path';

const eslintGlobalRulesForFix = [];

/**
 * Lint-staged command for running eslint in packages or apps.
 * @param {{cwd: string, files: string[], fix: boolean, fixType?: ('problem'|'suggestion'|'layout'|'directive')[], cache: boolean, rules?: string[], maxWarnings?: number}} params
 */
export const getEslintFixCmd = ({
  cwd,
  files,
  rules,
  fix,
  fixType,
  cache,
  maxWarnings,
}) => {
  const cliRules = [...(rules ?? []), ...eslintGlobalRulesForFix]
    .filter((rule) => rule.trim().length > 0)
    .map((r) => `"${r.trim()}"`);

  // For lint-staged it's safer to not apply the fix command if it changes the AST
  // @see https://eslint.org/docs/user-guide/command-line-interface#--fix-type
  const cliFixType = [...(fixType ?? ['layout'])].filter(
    (type) => type.trim().length > 0
  );

  const args = [
    cache ? '--cache' : '',
    fix ? '--fix' : '',
    cliFixType.length > 0 ? `--fix-type ${cliFixType.join(',')}` : '',
    maxWarnings !== undefined ? `--max-warnings=${maxWarnings}` : '',
    cliRules.length > 0 ? `--rule ${cliRules.join(' --rule ')}` : '',
    files
      // makes output cleaner by removing absolute paths from filenames
      .map((f) => `"./${path.relative(cwd, f)}"`)
      .join(' '),
  ].join(' ');
  return `eslint ${args}`;
};
