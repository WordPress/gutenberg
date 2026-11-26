---
name: wp-ui-migration
description: Use when replacing a `@wordpress/components` component with its `@wordpress/ui` counterpart in a plugin, theme, or application, or when deciding whether such a migration is worth doing.
---

# Migrate from `@wordpress/components` to `@wordpress/ui`

This skill ships with the `@wordpress/ui` package and matches the installed version. `@wordpress/components` remains supported, and the move to `@wordpress/ui` happens one component at a time. A component with a similar name is not necessarily a replacement.

## 1. Decide whether to migrate

-   Check that the component is recommended in `@wordpress/ui`. Use the Design System MCP server's `get_components`, then `get_component_details`, when available. Otherwise, use the [`use-recommended-components` rule documentation](https://github.com/WordPress/gutenberg/blob/trunk/packages/eslint-plugin/docs/rules/use-recommended-components.md) and the component's status in the [Storybook](https://wordpress.github.io/gutenberg/).
-   Do not migrate mechanically, and do not migrate a component only because a replacement exists. Migrate when you are already changing that code, when the new component brings a tangible benefit, or when the legacy component is deprecated.
-   For a narrow text or prop change, keep the component that is already there.
-   Check whether the project configures `@wordpress/use-recommended-components` with `allowUseWithCaution: true`. If it does, adopting components marked "Use with caution" in the Storybook is fine alongside stable ones. Do this in new UI that uses only `@wordpress/ui` components. Do not do it in a view that mixes `@wordpress/components` and `@wordpress/ui`, because their visual design and behavior can differ. Without that option, treat "Use with caution" components as not ready to adopt.

## 2. Take an inventory with ESLint

Run the project's installed tools, and never a bare `npx`, which downloads a package that is not installed and does not ask first in a non-interactive shell. The commands below use npm. With pnpm, use `pnpm exec eslint`, and with Yarn, use `yarn eslint`.

This applies when the project enables the `@wordpress/use-recommended-components` rule. The `wp-ui-setup` skill describes how to enable it. Use ESLint's JSON output as the source of the inventory, and do not search the code by hand.

-   Run the project's installed ESLint, for example `npm exec --no -- eslint . --format json --output-file eslint-report.json`, limited to the source directories if the project is large. Read the report, and do not commit it.
-   Keep only the messages with the `ruleId` `@wordpress/use-recommended-components`. Each has the `filePath`, `line` and `column` of the import, and a `message` that says what to use instead.
-   Group the messages by the imported component and count them. Some messages do not name the component, so read the import specifier at the reported line and column. List the most used components first.
-   Separate three kinds of result. A message that names a `@wordpress/ui` replacement is a candidate for migration. A message that says to write your own CSS, or that the component is planned for deprecation, has no `@wordpress/ui` replacement, so do not migrate it. A flagged `@wordpress/ui` component is not recommended yet, or is marked "Use with caution".
-   For each candidate, link its **Migration Guide** page in the [Storybook](https://wordpress.github.io/gutenberg/), which is under the legacy component. If there is no guide, say so.
-   If the project uses ESLint's suppressions baseline, suppressed reports are not in the output. Read `eslint-suppressions.json` for the files and counts of the suppressed ones.
-   Show the inventory to the user, and migrate one component at a time from it.

## 3. Check the target version

-   If the application bundles `@wordpress/ui`, check the installed version for the exports and props you need.
-   If WordPress provides `@wordpress/components` at runtime, check the minimum WordPress version you support. `@wordpress/ui` is an npm package and is not provided by WordPress, so it must be bundled.
-   Follow the setup in the package README for each document where the component renders, including iframes and popup windows. Test overlays and focus in their real rendering document, especially next to `@wordpress/components` overlays.

## 4. Read the migration guide, then compare contracts

-   Look for the component's **Migration Guide** page in the Storybook, under the legacy component. Use it for renamed props, changed callbacks and removed behavior.
-   Without a guide, or to check one, compare the old and new component yourself: accepted values and defaults, controlled and uncontrolled state, callback arguments, rendered semantics, ref targets, styling hooks, keyboard and focus behavior, and submitted form values.
-   Do not assume props keep their names. For example, `onChange` can become a differently named callback with a different argument.
-   Check extension points your code exposes to others, such as SlotFill children and render callbacks. An adapter that handles your own callers may not handle values that other plugins pass.

## 5. Migrate the styles with the component

-   Use the new component's design as it is. Do not override its appearance: no custom colors, borders, radii, typography, shadows or spacing inside the component, and no CSS that only reproduces how the legacy component looked. Remove that CSS during the migration. Use the component's props for variants, tones and sizes.
-   The only styles that belong with the component are sizing and layout, such as its width or its position in a layout. The component does not decide those, so the code that uses it does, usually with `Stack` or a layout style on a wrapper.
-   Delete selectors that target internal `.components-*` class names. They do not apply to `@wordpress/ui` components and are not stable. A selector can be shared with legacy components that remain in the project, so remove it only after checking that no remaining component uses it.
-   Replace legacy Sass color variables and `--wp-admin-*` custom properties in the code you touch with `--wpds-*` tokens chosen by semantic role. Use the `wp-theme` skill.
-   Replace hand-built layout and text around the component with `Stack`, `Text` and `Link` when that matches the existing design.
-   Prefer a recommended `@wordpress/ui` or `@wordpress/components` component over one from an application or plugin component library when it covers the same use.
-   If a new component seems to misbehave, suspect a CSS reset or specificity conflict in your project before adding a workaround.
-   If a feature or design that the legacy component had is missing from the new component, do not override the new component's styles to get it. First check whether the latest version of `@wordpress/ui` already has the feature or component, in the package changelog, the [Storybook](https://wordpress.github.io/gutenberg/) or the latest release on npm. If it does, suggest updating the package. Then search the [WordPress/gutenberg issues](https://github.com/WordPress/gutenberg/issues) for an existing request for the feature. If there is none, raise a feature request that describes the missing feature or design. Use the component as it is in the meantime, or keep the legacy component for that use. If a workaround for missing behavior cannot wait, keep it temporary and add a code comment that links the issue.

## 6. Migrate and verify

-   Migrate one component or area at a time, and keep the change focused.
-   Use documented props and public exports only. Do not import from package-private paths or copy a component's implementation.
-   If the public API cannot meet a need, describe the missing behavior and your attempted composition, and report it upstream instead of working around it.
-   Run your lint, type and test checks. Check the keyboard and pointer paths, accessible names, dismissal and focus return in a browser, because unit tests do not prove visual parity or overlay behavior.
-   Report what you verified and any parity you could not confirm.

## 7. Migrate gradually with lint suppressions

This applies when the project enables the `@wordpress/use-recommended-components` rule. The `wp-ui-setup` skill describes how to enable it.

-   Bulk suppressions need ESLint 9.24 or later. Check the installed ESLint version, for example with `npm exec --no -- eslint --version`. If it is older, suggest upgrading ESLint. If the user does not want to upgrade, ask them which of these to do instead, and do not choose for them:
    -   Set the rule to `warn` for now and skip the baseline.
    -   Migrate the existing usage first, and enable the rule as `error` only after that.
    -   Turn the rule off for the files that still use the old components, for example with an `ignores` list or a configuration object for those files, and migrate them later.
-   Do not migrate everything at once. Record the existing reports as a baseline with ESLint's bulk suppressions, for example `npm exec --no -- eslint --suppress-rule @wordpress/use-recommended-components`, and commit the generated suppressions file. New code is then checked, while existing code is migrated gradually.
-   After you migrate a component, run `npm exec --no -- eslint --prune-suppressions` and commit the reduced suppressions.
-   For an intentional early use of a component, follow the rule's inline exceptions guidance: put an `eslint-disable-next-line` comment with a reason above that import specifier, so the other components in the import stay checked. The rule's [documentation](https://github.com/WordPress/gutenberg/blob/trunk/packages/eslint-plugin/docs/rules/use-recommended-components.md) has an example.
