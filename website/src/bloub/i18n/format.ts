/**
 * Mecanique de texte de la couche i18n : substitution et choix de forme.
 *
 * Separee de `index.ts` parce qu'elle est pure — ni dictionnaire, ni langue
 * courante, ni DOM. C'est la partie ou les regles sont subtiles (le francais
 * compte zero comme un singulier, le chinois n'a qu'une forme), donc celle qui
 * merite d'etre testee sans avoir a simuler un navigateur.
 */

/** Separateur des formes de pluriel dans les dictionnaires. */
const SEPARATEUR = ' | ';

/**
 * Remplace les `{nom}` par leur valeur. Un `{nom}` sans valeur fournie reste
 * tel quel : visible a l'ecran, donc reperable, la ou une chaine vide se
 * confondrait avec un texte simplement mal ecrit.
 */
export function interpoler(
  texte: string,
  valeurs?: Record<string, string | number>
): string {
  if (!valeurs) return texte;
  let sortie = texte;
  for (const [nom, valeur] of Object.entries(valeurs)) {
    sortie = sortie.replaceAll(`{${nom}}`, String(valeur));
  }
  return sortie;
}

/**
 * Choisit la forme qui convient a `n` parmi celles du gabarit, separees par
 * ` | ` dans l'ordre singulier puis pluriel.
 *
 * C'est `Intl.PluralRules` qui tranche, et pas un `n === 1` : le francais range
 * zero avec le singulier (« 0 animation »), l'anglais avec le pluriel
 * (« 0 animations »). Un gabarit d'une seule forme la rend toujours — c'est le
 * cas du chinois, qui n'a pas de pluriel.
 */
export function formePlurielle(
  gabarit: string,
  n: number,
  tag: string
): string {
  const formes = gabarit.split(SEPARATEUR);
  if (formes.length < 2) return formes[0]!;
  const index = new Intl.PluralRules(tag).select(n) === 'one' ? 0 : 1;
  return formes[index] ?? formes[0]!;
}
