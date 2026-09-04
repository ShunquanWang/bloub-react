import { ecris, lis } from '../ui/stockage';
import { formePlurielle, interpoler } from './format';
import {
  choisirLangue,
  estLangue,
  type Langue,
  LANGUE_PAR_DEFAUT,
  tagDe,
} from './langues';
import en from './locales/en';
import fr from './locales/fr';
import zh from './locales/zh';

export { type Langue, LANGUES } from './langues';

/**
 * `Record<Langue, typeof fr>` et pas un objet libre : ajouter une langue a
 * `LANGUES` sans ecrire son dictionnaire devient une erreur de compilation.
 */
const dictionnaires: Record<Langue, typeof fr> = { fr, en, zh };

/**
 * Chemins pointes du dictionnaire. C'est ce type qui fait que `t('reglage.x')`
 * ne compile pas : la signature de `t` n'accepte rien d'autre qu'une cle qui
 * existe vraiment dans `fr.ts`.
 */
type Chemins<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Chemins<T[K], `${P}${K}.`>;
}[keyof T & string];

export type Cle = Chemins<typeof fr>;

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

/**
 * Langue stable SSR + premier rendu client (hydratation).
 * La detection navigateur / localStorage ne se fait qu'apres montage.
 */
let courante: Langue = LANGUE_PAR_DEFAUT;
let demarree = false;

/** Snapshot serveur / hydratation — doit rester identique des deux cotes. */
export function getServerLangue(): Langue {
  return LANGUE_PAR_DEFAUT;
}

/**
 * Applique la preference memorisee ou le navigateur. A appeler une seule fois
 * apres hydratation : avant, `courante` reste le defaut pour ne pas diverger
 * du HTML serveur.
 */
export function bootLangue() {
  if (demarree || typeof navigator === 'undefined') return;
  demarree = true;
  const next = choisirLangue(
    lis('langue'),
    navigator.languages ?? [navigator.language]
  );
  if (next !== courante) {
    courante = next;
    notify();
  }
  syncDocumentLang();
}

/** Langue courante (lecture). */
export function getLangue(): Langue {
  return courante;
}

/**
 * Pose la langue et l'inscrit au stockage. La langue DETECTEE ne s'y inscrit
 * pas toute seule : seul un choix explicite fige la preference.
 */
export function setLangue(valeur: Langue) {
  if (!estLangue(valeur) || valeur === courante) return;
  courante = valeur;
  ecris('langue', valeur);
  syncDocumentLang();
  notify();
}

/** Abonnement pour `useSyncExternalStore`. */
export function subscribeLangue(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDictionnaire() {
  return dictionnaires[courante];
}

/** Etiquette BCP 47 de la langue courante, pour `Intl` et l'attribut `lang`. */
export function getTag() {
  return tagDe(courante);
}

/** Les formateurs sont chers a construire et relus a chaque image de la piste. */
const formateurs = new Map<string, Intl.NumberFormat>();

function formateur(
  cle: string,
  options: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const memo = `${getTag()}:${cle}`;
  let f = formateurs.get(memo);
  if (!f) {
    f = new Intl.NumberFormat(getTag(), options);
    formateurs.set(memo, f);
  }
  return f;
}

/**
 * Nombre dans la convention de la langue. Indispensable pour les durees : le
 * separateur decimal est une virgule en francais et un point en anglais, et le
 * `.replace('.', ',')` qui tenait lieu de formatage etait donc faux des qu'on
 * quittait le francais.
 */
export function nombre(valeur: number, decimales = 0): string {
  return formateur(`n${decimales}`, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur);
}

/**
 * Pourcentage, depuis une fraction. Le francais insere une espace insecable
 * avant le signe, l'anglais et le chinois le collent — `Intl` connait la regle,
 * la concatenation non.
 */
export function pourcentage(fraction: number): string {
  return formateur('%', { style: 'percent', maximumFractionDigits: 0 }).format(
    fraction
  );
}

function brut(cle: Cle): string {
  const noeud = cle
    .split('.')
    .reduce<unknown>(
      (n, k) => (n as Record<string, unknown>)[k],
      getDictionnaire()
    );
  return noeud as string;
}

/** `t('panel.shape')`, `t('cycles.menuRenameAria', { name })`. */
export function t(cle: Cle, valeurs?: Record<string, string | number>): string {
  return interpoler(brut(cle), valeurs);
}

/** Pluriel : `n` est toujours disponible comme `{n}` dans le gabarit. */
export function pluriel(
  cle: Cle,
  n: number,
  valeurs?: Record<string, string | number>
): string {
  return interpoler(formePlurielle(brut(cle), n, getTag()), { n, ...valeurs });
}

/**
 * Nom d'un montage. Un nom vide est celui du montage d'amorce, que l'utilisateur
 * n'a jamais nomme : il suit donc la langue. Type structurel plutot que `Cycle`
 * importe, pour que la couche i18n ne depende pas de `src/bot/`.
 */
export function nomDeCycle(cycle: { name: string }): string {
  return cycle.name || t('cycles.defaultName');
}

/** Duree lisible : `2,4 s`, `2.4 s`, `2.4 秒`. */
export function secondes(valeur: number): string {
  return t('units.seconds', { n: nombre(valeur, 1) });
}

/**
 * Meme duree, serree, pour la graduation de la regle : elle est chiffree tous
 * les 52 px et une espace de plus y ferait chevaucher les etiquettes.
 */
export function secondesCourtes(valeur: number, decimales: number): string {
  return t('units.secondsShort', { n: nombre(valeur, decimales) });
}

/** Applique `lang` / titre document une fois le DOM pret. */
export function syncDocumentLang() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = getTag();
  document.title = t('app.title');
}
