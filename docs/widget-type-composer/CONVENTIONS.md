# Widget Type Composer — working conventions

This feature is built as many small, atomic, independently reviewable steps that
accumulate on one integration branch, documented as they land. It is explicitly
multi-session and multi-agent: the docs in this folder are the shared state.

## Branches

- `feature/widget-type-composer` — the integration branch. Every step merges
  here. Built up from `trunk`; not proposed to `trunk` until the feature
  graduates.
- `wtc/NN-<slug>` — one branch per atomic step (e.g. `wtc/03-code-registered`),
  branched from the **current tip of the feature branch** and merged back when
  done (hub-and-spoke). Independent steps run in parallel; a step waits only for
  the steps listed in its `Depends on` to be on the feature branch first.
- `recovered/widget-type-composer` — the **oracle**: a complete,
  working-but-unstructured version of the whole vertical. Consult it for the
  target shape of any piece. Never merge from it; re-derive cleanly.

## A step's lifecycle (one agent, one step, one branch)

1. Pick a step from `PLAN.md` whose `Depends on` are all `done`. Mark it
   `in-progress` in `PLAN.md` with your branch name.
2. From an up-to-date feature tip: `git switch feature/widget-type-composer`
   then `git switch -c wtc/NN-<slug>`.
3. Read `ARCHITECTURE.md`, the step's section in `PLAN.md`, and the matching
   files in the oracle. Implement **only** that step's scope.
4. Keep `steps/NN-<slug>.md` (from `steps/_TEMPLATE.md`) as a working log:
   decisions, deviations from the oracle, follow-ups.
5. Pass the Gates. Set the step `done` in `PLAN.md` and finish the step doc.
6. Open a PR into `feature/widget-type-composer`.

## Gates (a step is not done until all pass)

- Typecheck clean: `node_modules/.bin/tsgo --noEmit -p <package>/tsconfig.json`.
- Lint clean on touched files: `npm run lint:js`, `vendor/bin/phpcs <files>`.
- PHP: `php -l` on touched files; `vendor/bin/phpunit` for the step's tests.
- The step's **acceptance criteria** in `PLAN.md` hold, demonstrated in the
  step doc.

## Scope discipline

- One step changes one concern. Work discovered outside the step becomes a
  follow-up in the step doc and, if it blocks, a new step in `PLAN.md`. Do not
  widen the branch.
- Edit `trunk`-shared files (REST controllers, package `index.ts`,
  `lib/load.php`, `experiments/load.php`) additively and behind the experiment
  gate, so the feature is inert when the flag is off.

## Style

- Experiment flag: `gutenberg-widget-type-composer`, built on the
  `gutenberg-dashboard-widgets` experience. PHP under
  `lib/experimental/widget-type-composer/`; JS in `packages/widget-primitives`
  and `packages/widget-dashboard`.
- Commits and branch names in English; imperative, concise; no ticket codes.
- Every behavior-bearing step updates docs. A step that does not touch its
  `PLAN.md` status or its step doc is incomplete.
