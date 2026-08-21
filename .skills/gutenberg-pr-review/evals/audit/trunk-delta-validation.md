# Trunk-delta validation

Inspected the exact six-commit, 31-file range `49120c3..03a6675`; `49120c3` is the merge base.

## Commits and relevant files

1. `65951ddf6afd2d41ae679f2c440e05d6ac156f90` — `createInterpolateElement` unmatched closing tags
   `packages/element/{CHANGELOG.md,src/create-interpolate-element.ts,src/test/create-interpolate-element.tsx}`

2. `b2ab2ccba568a4031493cb7d087b2a2d07e0dc70` — remove private Components `Theme`
   `docs/private-apis.md`, `tools/eslint/config.mjs`, `packages/components/{CHANGELOG.md,src/private-apis.ts}`, and all eight deleted files under `packages/components/src/theme/`.

3. `c61142588be492a045fbe4b6b6660078907afb19` — refactor `URLInput`
   `packages/block-editor/{CHANGELOG.md,README.md,src/components/url-input/index.js,src/components/url-input/test/index.js}`

4. `fe47e1c427d05f10aecaa1f50026dffd0b562be3` — Dialog/Drawer guidance
   `packages/ui/{CHANGELOG.md,src/dialog/stories/usage-guidelines.mdx,src/dialog/stories/usage-guidelines.story.tsx,src/drawer/root.tsx}`

5. `f290c8b117c2b3333fba37474bebd5a26fa32202` — `date-fns` 4.4.0
   `package-lock.json`; `packages/{components,dataviews,editor}/{package.json,CHANGELOG.md}`

6. `03a6675a25ede7f8e31e5232742615f95358bcb6` — Color.js 0.7.1
   `package-lock.json`; `packages/theme/{package.json,CHANGELOG.md}`

Also checked `packages/README.md`, `.github/workflows/check-package-changelogs.yml`, and `docs/contributors/code/workspace-development.md` for governing conventions.

## Required guidance changes

1. `packages-apis-compatibility.md` — narrow the compatibility-remediation rule to public/durable contracts. Private APIs are intentionally removable.

   Replace:

   > When compatibility cannot be preserved directly, provide a supported alternative, deprecation metadata, migration path, correctly classified changelog entry, and a Dev Note when third-party developers are affected.

   With:

   > When a documented public API or durable stored contract cannot be preserved directly, provide a supported alternative, deprecation metadata, migration path, correctly classified changelog entry, and a Dev Note when third-party developers are affected. Private APIs do not promise external compatibility; before removing one, inventory and update in-repository consumers, private-API documentation, and the package changelog.

2. `ui-accessibility.md` — supersede the Modal-only overlay wording with current component-selection guidance.

   Replace the “For Modal and Popover changes…” bullet with:

   > For overlay changes, verify both component choice and behavior. Use `Dialog` for short, focused, context-light tasks with one primary action; use `AlertDialog` for destructive or irreversible decisions; use `Drawer` for contextual editing, multiple sections, or drill-down flows; and do not nest dialogs. Test initial focus, dismissal, required containment, focus restoration, viewport behavior, and mobile expansion. For Popovers, also test anchoring and collision behavior.

   Narrow the destructive-action bullet to add:

   > In a Drawer requiring explicit choice, omit the close icon and provide explicit Cancel/Confirm actions.

3. `testing-docs-delivery.md` — the changelog rule is too narrow. Current repository guidance covers relevant package changes, including dependency and material documentation changes.

   Replace:

   > For package production-code changes, add the relevant entry under `Unreleased` and classify it with the repository's release subsection.

   With:

   > For each relevant package change—including production code, shipped dependencies, public or private API changes, and material package documentation—add an entry under `Unreleased`, link the PR, and classify it under the appropriate release subsection. Omission is acceptable only when the package’s optional changelog check and repository evidence establish that the change is too small to warrant an entry.

4. `SKILL.md` provenance — replace the validated head `49120c3204955ba1f83c7224793f52813689e7e1` with `03a6675a25ede7f8e31e5232742615f95358bcb6`.

## Conclusion

No other rule is invalidated. The `URLInput` refactor reinforces the existing hook, event-time selector, stale-request, accessibility, and behavioral-testing guidance. Both dependency updates follow the workspace/package-lock convention; no build or generated-artifact rule changed.

The safely recordable delta-checked head is:

`03a6675a25ede7f8e31e5232742615f95358bcb6`

No files were edited and no network access was used.
