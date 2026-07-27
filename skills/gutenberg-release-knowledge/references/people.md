# People and trust tiers

Use this reference to weigh architectural claims by author. The live team list is authoritative; this snapshot is a fallback.

## Source of truth

Maintainer status is defined by membership in the WordPress/gutenberg `gutenberg-core` team. Fetch the current list when GitHub authentication permits:

```bash
gh api orgs/WordPress/teams/gutenberg-core/members --paginate -q '.[].login'
```

## Tier 1: project leaders

Weight stated direction from either leader above other evidence on questions of why and project direction:

-   `mtias` (Matias Ventura)
-   `youknowriad` (Riad Benguella)

## Tier 2: maintainers

Snapshot as of 2026-07-22. This includes the two leaders above.

```text
aaronrobertshaw
adamziel
aduth
andrewserong
aristath
cbravobernal
ciampo
draganescu
ellatrix
fabiankaegy
getdave
glendaviesnz
gziolo
jameskoster
jasmussen
jorgefilipecosta
jsnajdr
karmatosed
kevin940726
luisherranz
Mamaduka
mcsf
michalczaplinski
mikachan
mirka
mtias
nerrad
noisysocks
ntsekouras
oandregal
ockham
priethor
ramonjd
richtabor
SantosGuillamot
scruffian
sirreal
t-hamano
talldan
tellthemachines
tyxla
youknowriad
```

## Tier 3 and below

Tier 3 is an author with merged history in the repository, judged from their pull-request record at the relevant time. Everyone else is Tier 4. Treat bots as near-zero-trust authors. Use CODEOWNERS as a secondary signal that a maintainer owns the affected area.
