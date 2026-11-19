// Spanish versions of shared content, paired with the English data they mirror.
// Anything that isn't words (map pins, addresses, categories, authors) comes
// from the English file, so it can't drift. The build fails if the two files
// fall out of step (a new branch, glossary term, or step with no Spanish yet).
import glossaryEn from '../data/glossary.json';
import quotesEn from '../data/quotes.json';
import groupsEn from '../data/working-groups.json';
import stepsEn from '../data/getting-started.json';
import shared from '../data/es/shared.json';
import branchesEs from '../data/es/branches.json';
import { resolveLink } from './member-guide';

function sameLength(name: string, en: unknown[], es: unknown[]) {
  if (en.length !== es.length) {
    throw new Error(`src/data/es/shared.json: "${name}" has ${es.length} entries but the English has ${en.length}. Add or remove the Spanish to match.`);
  }
}

sameLength('glossary', glossaryEn, shared.glossary);
sameLength('quotes', quotesEn, shared.quotes);
sameLength('workingGroups', groupsEn, shared.workingGroups);
sameLength('steps', stepsEn.steps, shared.steps);

/** Glossary terms in Spanish, each with the English entry's category. */
export const glossaryEs = shared.glossary.map((g, i) => ({ ...g, category: glossaryEn[i].category }));

/** Quotes in Spanish, with the speaker from the English file. */
export const quotesEs = shared.quotes.map((q, i) => ({ ...q, who: quotesEn[i].who }));
export const quotesNote = shared.quotesNote;

export const workingGroupsEs = shared.workingGroups;

/** Getting-started steps with their links resolved. */
export const stepsEs = shared.steps.map((s) => {
  const link = resolveLink(s.cta);
  return { title: s.title, body: s.body, cta: { label: s.cta.label, href: link.href, external: link.external } };
});

type BranchEs = { area: string; meets: string; venue: string; remote?: string; access?: string; body: string[] };

/** The Spanish text for one branch. Fails the build if a branch has none yet. */
export function branchEs(id: string): BranchEs {
  const b = (branchesEs as Record<string, BranchEs | string>)[id];
  if (!b || typeof b === 'string') {
    throw new Error(`src/data/es/branches.json has no entry for the branch "${id}". Add one (copy an existing entry).`);
  }
  return b;
}
