# Keyboard Selection

## Must fix

- `packages/block-editor/src/components/writing-flow/use-arrow-nav.js:300` — Preserve Shift+Arrow behavior inside native inputs. This branch runs before `isNavigationCandidate`, so focusing a selected Search block’s placeholder input and pressing Shift+ArrowLeft/Right can multi-select an adjacent block instead of extending the input’s text selection. Require a block-wrapper target or apply the existing native-input guard before handling block selection; add coverage for an input inside a selected block.

## Should fix

- `packages/block-editor/src/components/writing-flow/use-arrow-nav.js:175` — Add this production behavior change to `packages/block-editor/CHANGELOG.md` under “Unreleased,” as required by the package contribution guidance.

Review was static; tests were not run.
