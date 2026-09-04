'use client';

import type { KeyboardEvent } from 'react';
import { LANGUES, t } from '../i18n';
import { useLangue } from '../i18n/react';

/** Comptes de l'auteur (React port). */
const AUTHOR = 'https://github.com/ShunquanWang';
const GITHUB = 'https://github.com/ShunquanWang/bloub-react';

/**
 * « Cree par Shunquan Wang » : le nom est un lien, donc la phrase se coupe autour de
 * lui. On ne peut pas la decouper en deux traductions (« Cree par » + le nom) —
 * le chinois met l'auteur AU MILIEU (« 由 X 创作 ») et l'anglais devant le verbe.
 * Le gabarit garde donc `{name}` et c'est ici qu'on separe ce qui vient avant de
 * ce qui vient apres.
 */
function credits() {
  const [avant = '', apres = ''] = t('settings.credits').split('{name}');
  return { avant, apres };
}

export function Settings() {
  const [langue, setLangue] = useLangue();
  const { avant, apres } = credits();

  /**
   * Clavier du groupe de radios.
   *
   * Declarer `role="radiogroup"` PROMET ce comportement, et des `<button>` ne le
   * donnent pas tout seuls : les fleches doivent deplacer le choix, et le groupe
   * entier ne doit compter que pour UN arret de tabulation. D'ou aussi le
   * `tabindex` mobile dans le gabarit — seule l'option cochee est atteignable par
   * Tab, les fleches font le reste, comme dans un groupe de radios natif.
   */
  function auClavier(event: KeyboardEvent, index: number) {
    const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key as 'ArrowRight' | 'ArrowDown' | 'ArrowLeft' | 'ArrowUp'
    ];
    if (!pas) return;
    event.preventDefault();
    // on tourne en rond, comme un groupe de radios natif
    const cible = LANGUES[(index + pas + LANGUES.length) % LANGUES.length]!;
    setLangue(cible.id);
    // le focus suit le choix, sinon les fleches suivantes repartent de l'ancien
    const boutons = (event.currentTarget as HTMLElement).parentElement
      ?.children;
    const suivant = boutons?.[LANGUES.indexOf(cible)];
    if (suivant instanceof HTMLElement) suivant.focus();
  }

  return (
    <div>
      <h2 className="text-sm font-semibold">{t('settings.language')}</h2>

      {/*
        Un groupe de boutons radio et non un `<select>` : trois choix se montrent
        entierement, et le drapeau ne se lit pas dans une liste deroulante fermee.

        Chaque bouton porte son `aria-label` en clair plutot que de compter sur le
        nom deduit de son contenu : sur un radio reconstruit, ce calcul n'est pas
        rendu de la meme facon partout, et le nom est ce qui rend le choix
        annoncable. Il reprend exactement le texte visible, comme l'exige le
        critere « intitule dans le nom ».

        `lang` est sur le bouton et pas sur le texte : le nom accessible en herite,
        donc la synthese vocale prononce « 简体中文 » en chinois et non avec la voix
        de la langue courante.
      */}
      <div
        className="mt-2 flex flex-col gap-1"
        role="radiogroup"
        aria-label={t('settings.language')}
      >
        {LANGUES.map((l, i) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={l.id === langue}
            aria-label={l.nom}
            lang={l.tag}
            tabIndex={l.id === langue ? 0 : -1}
            onKeyDown={(e) => auClavier(e, i)}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition ${
              l.id === langue
                ? 'border-[var(--ink)] bg-white font-medium'
                : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--muted)] hover:text-[var(--ink)]'
            }`}
            onClick={() => setLangue(l.id)}
          >
            {/* le drapeau est decoratif : le nom de la langue dit deja tout, et un
                 lecteur d'ecran annoncerait « drapeau de la France » pour rien */}
            <span className="text-base leading-none" aria-hidden="true">
              {l.emoji}
            </span>
            <span className="flex-1">{l.nom}</span>
            {l.id === langue && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M2.5 6.4 4.8 8.7 9.5 3.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-semibold">{t('settings.about')}</h2>

      {/* `rel="noreferrer"` en plus de `noopener` : rien a apprendre a la cible
           sur la page d'ou vient le clic */}
      <a
        className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm transition hover:border-[var(--muted)]"
        href={GITHUB}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('settings.githubAria')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M8 .5a7.5 7.5 0 0 0-2.37 14.62c.37.07.5-.16.5-.36v-1.3c-2.09.46-2.53-.99-2.53-.99-.34-.87-.83-1.1-.83-1.1-.68-.47.05-.46.05-.46.75.06 1.15.78 1.15.78.67 1.15 1.76.82 2.19.63.07-.49.26-.83.48-1.02-1.67-.19-3.42-.83-3.42-3.72 0-.82.29-1.5.78-2.02-.08-.19-.34-.96.07-1.99 0 0 .63-.2 2.06.77a7.1 7.1 0 0 1 3.75 0c1.43-.97 2.06-.77 2.06-.77.41 1.03.15 1.8.07 1.99.49.52.78 1.2.78 2.02 0 2.9-1.76 3.53-3.44 3.71.27.23.51.69.51 1.39v2.06c0 .2.13.44.51.36A7.5 7.5 0 0 0 8 .5z"
            fill="currentColor"
          />
        </svg>
        <span className="flex-1">{t('settings.github')}</span>
        {/* fleche de lien sortant : elle previent que l'onglet va changer */}
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="shrink-0 text-[var(--muted)]"
        >
          <path
            d="M4 2h6v6M10 2 3 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      <p className="mt-4 text-xs text-[var(--muted)]">
        {avant}
        <a
          className="font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-2 transition hover:decoration-[var(--ink)]"
          href={AUTHOR}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('settings.creditsAria')}
        >
          Shunquan Wang
        </a>
        {apres}
      </p>
    </div>
  );
}

export default Settings;
