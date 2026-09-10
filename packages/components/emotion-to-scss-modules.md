# Migrating components from Emotion to SCSS Modules

An Emotion migration should preserve the component's public API, rendered elements, interactions, and resulting styles. Use the existing SCSS Modules and `@wordpress/style-runtime` pipeline. A component migration does not require a new CSS extraction pipeline.

This temporary guide collects the [migration guidelines in #66806](https://github.com/WordPress/gutenberg/issues/66806) and lessons from its merged PRs. The [reference migrations](#reference-migrations) identify useful examples and their limitations. Read the current implementation before copying an older diff. Some merged PRs include explicitly agreed visual or behavior changes that are not part of a mechanical migration.

## Establish the component and consumer contract

Before editing, read the component's types, README, stories, style hooks, and composed primitives. Search for consumers of its exported wrappers, style fragments, and public classes, including outside `packages/components`. A shared style file can serve several components, as with `ColorPalette` and `GradientPicker`.

Record the behavior that needs comparison:

-   Default rendered element, supported `as` targets, refs, prop forwarding, and intrinsic HTML/SVG prop filtering.
-   Existing public classes and which element adds each one. `useContextSystem` may already supply the root class. Keep legacy spellings, including singular `component-*` names.
-   Consumer `className` and `style` handling, including spread order and conditional forwarding.
-   Defaults, variants, nested instances, focus and disabled states, directional styles, and animation state changes.
-   Selectors that override the component and selectors the component uses to override its children.
-   Portal and iframe paths, including the document that receives styles.

Capture a focused baseline in Storybook or the editor for the states and consumers at risk. If a regression motivates the migration, reproduce it before changing the implementation. An unchanged isolated story cannot establish compatibility for a consumer that adds its own styles.

### Replace wrappers without changing their role

For `styled( ExistingComponent )`, apply the module class to that same component when it already supplies the needed behavior. Do not replace `Flex`, `Heading`, `Text`, or an input control with a native element just because its wrapper only contained CSS.

For a wrapper that relied directly on Emotion's `as` support, inspect and reuse [`PolymorphicElement`](/packages/components/src/utils/polymorphic-element.tsx). Preserve the original default tag and the component's existing ref and prop contract. `View` already delegates to this utility. A fixed internal element with no exposed polymorphic path can remain a plain element.

Check the current [`WordPressComponent` types](/packages/components/src/context/wordpress-component.ts) instead of introducing another polymorphic type system. [#80705](https://github.com/WordPress/gutenberg/pull/80705) deliberately reduced intrinsic-prop type complexity to control compilation cost. Removing Emotion does not remove the compatibility obligation for `as`.

Keep shared wrappers' private module classes separate from public classes added by callers. In [#80001](https://github.com/WordPress/gutenberg/pull/80001), adding BaseControl label/help classes inside shared wrappers made unrelated consumers match BaseControl selectors; adding classes on both sides also produced duplicates. Test a real `as="legend"` consumer when migrating shared labels, including its visible and visually hidden branches.

`View`'s legacy `css` prop is an explicit exception established by [#79443](https://github.com/WordPress/gutenberg/pull/79443). It remains accepted as a no-op and is consumed before rendering. Do not restore its styling behavior, forward it to the DOM, or treat that decision as permission to remove other props.

## Translate the styles

Follow the package's [styling conventions](/packages/components/CONTRIBUTING.md#styling). Put static declarations in a colocated `style.module.scss`, use kebab-case classes, and compose variants with `clsx`. Use existing semantic attributes and pseudo-classes where appropriate; do not add data attributes solely to select styles.

Name modifier classes for their state and make their owning element clear. When scoping a modifier under a base class, account for the extra specificity. A standalone `.is-active` and `.root.is-active` do not have equal specificity.

Keep fixed values and calculations in Sass when JavaScript does not need them. `ProgressBar` moved its constant indeterminate indicator width into Sass and shared it with the keyframes. CSS Module keyframes can have descriptive local names without component prefixes.

### Preserve dynamic values and overrides

Prefer inline custom properties for genuinely dynamic values, with the actual property declared in the stylesheet. Emotion adds units to many numeric CSS values; custom properties do not. Preserve the original conversion, such as `space( value )` or an explicit `px` suffix, and keep zero distinct from an absent value.

Check these differences before choosing the representation:

-   **Cascade.** Moving `z-index` from a CSS rule to `style.zIndex` prevents ordinary consumer CSS from overriding it. [ZStack's review](https://github.com/WordPress/gutenberg/pull/80514#discussion_r3845479235) led to passing the number through a custom property and keeping `z-index` in the module rule.
-   **Precedence.** Preserve consumer `style` values and the component's existing override rules. Do not copy a universal spread order from another migration. `Spacer` lets consumer custom properties win; `Flex` supplies its internal variables after the consumer style object. Ordinary inline CSS properties still override stylesheet declarations.
-   **Inheritance.** Internal custom properties inherit unless reset. Reset them on each instance when nested components must not inherit a parent's values, as in `Spacer`. Do not reset intentionally inherited theme variables.
-   **Shorthands.** A later longhand with an absent custom property can undo the shorthand result. Preserve the fallback and precedence of all-sides, axis, and individual-side values. Check shorthand-only, longhand-only, and combined inputs, including supported CSS strings. The `Spacer` review caught missing longhand fallbacks.
-   **Accepted CSS values.** CSS-wide keywords apply to a custom property itself. `--style: inherit; border-style: var(--style, solid)` does not mean `border-style: inherit`. In [#80437](https://github.com/WordPress/gutenberg/pull/80437#discussion_r3608442254), the indicator retained direct `borderStyle` and `borderColor` values and the original `color || fallback` behavior. Check empty strings and CSS-wide values when the API accepts arbitrary CSS. Direct inline properties can be appropriate, but assess their effect on consumer overrides explicitly.

### Preserve direction, tokens, and state changes

Use logical properties where they preserve the intended behavior. Compare LTR and RTL, and relevant writing modes, before changing a physical property. `Surface` exposes physical border props; `TextareaControl` retains `resize: vertical`; `DropdownContentWrapper` offsets the Popover's physical padding. These are reasons for narrow lint suppressions, not a blanket ban on logical properties. `padding: 0` also resets more than `padding-inline: 0`.

Preserve necessary browser declarations and pseudo-elements. Examples include Truncate's `-webkit-box-orient: vertical`, SearchControl's WebKit search decorations, and TextareaControl's placeholder selectors and global dark-theme ancestor.

Prefer equivalent WPDS tokens and existing Sass variables or mixins. Check what they expand to, including fallback values and validated-control accent overrides. A similarly named token can change the color or geometry. Keep intentional visual changes explicit, as in `Surface` and `ToggleGroupControl`, instead of presenting them as style parity.

Compare transitions between states as well as static states. [ProgressBar's review](https://github.com/WordPress/gutenberg/pull/80512#discussion_r3830324726) caught a width transition newly applying when switching to indeterminate mode. Preserve the original animation direction, duration, transition conditions, reduced-motion rules, and forced-colors treatment where present.

## Preserve the winning declarations

CSS Module scoping prevents class-name collisions. It does not control specificity or stylesheet insertion order. The order of class names passed to `clsx` does not control the cascade either.

Compare matched declarations on the component and its consumers:

-   Keep low-specificity defaults overridable. The Divider migration added attribute-selector specificity and broke `CardDivider` and complementary-area border overrides. [#79534](https://github.com/WordPress/gutenberg/pull/79534) wrapped orientation attributes in `:where()` to remove that extra specificity.
-   Preserve deliberate Emotion `&&` or `&&&` increases. Sass can express these as `.wrapper.wrapper` or `.label.label.label`; raw `&&&` is not valid Dart Sass. ConfirmDialog's doubled selector keeps its overlay above the parent Popover.
-   Protect every declaration that must beat a still-Emotion-based primitive. ColorPalette initially protected `font-size` and margin but missed `line-height`; Heading's later rule won in the root document. ToolsPanel had a similar heading conflict.
-   Keep selector relationships and scope. Nesting `.layered > .child` under `.z-stack` adds specificity. Replacing Emotion component interpolation requires checking which real elements the new selector matches.
-   Mark existing external classes with `:global(...)` inside a CSS Module, for example `:global(.components-panel__row) &`. Do not accidentally hash a legacy class, broaden its matching elements, or add a public class solely to replace an internal selector.

Use the smallest selector change that preserves the required winner. Do not put every rule in `:where()`, increase every selector, or add `!important` to hide an unexplained conflict. Record why a deliberate specificity adjustment is needed.

### Audit remaining Emotion consumers

Removing an Emotion wrapper can expose source-order dependencies in callers that still use `useCx`. Where fragments overlap on a property, shorthand/longhand pair, or nested selector, compose them in one `css()` call before passing them to `cx()`:

```js
const classes = cx(
	css( baseStyles, condition && overrideStyles ),
	className
);
```

This is an interim compatibility fix for existing Emotion consumers, not a pattern for newly migrated styles. Do not mechanically combine unrelated fragments. Audit callers outside the migrated directory: [#79443](https://github.com/WordPress/gutenberg/pull/79443) updated several consumers but missed the BorderBoxControl gutter regression fixed in [#79967](https://github.com/WordPress/gutenberg/pull/79967).

Test mixed Emotion/Module composition in both the root and iframe documents when used there. [Scrollable's review](https://github.com/WordPress/gutenberg/pull/80694#discussion_r3845389532) found that `CardBody isScrollable` kept `height: 100%` in an iframe but resolved to `auto` in the root document because insertion order differed.

## Verify CSS delivery and behavior

Reuse existing tests and stories first. Add or extend a test only for a concrete migration risk that existing coverage does not protect. Choose the smallest check that observes the behavior and would fail if it regressed. A behavior-preserving migration may need no new tests. When automated tests cannot observe the real styling path, document a focused before/after browser check instead of adding a test that cannot detect the regression.

[`StyleProvider`](/packages/components/src/style-provider/index.tsx) both supplies an Emotion cache and registers a document with `@wordpress/style-runtime`. Keep the relevant provider and registration path while either responsibility is needed. Removing a component's Emotion import does not make this infrastructure redundant.

For SlotFill or portals, use an attached iframe with a real `contentDocument` and `defaultView`. Assert a computed style in the destination document. A class on the element or a style tag in the parent document does not prove delivery. [#80384](https://github.com/WordPress/gutenberg/pull/80384) pairs a registration test with a Storybook example that renders migrated Spacer styles in an iframe.

Match the evidence to the behavior at risk:

| What needs proof | Suitable evidence |
| --- | --- |
| DOM, public classes, refs, props, variants, and interactions | Existing component tests; extend them only for an uncovered integration risk. Assert the actual styled node, including the outer Grid child when an inner wrapper has the same class. |
| Real SCSS declarations, specificity, custom-property resolution, dimensions, and animation | Storybook or editor comparison using production styles, computed styles, and relevant interactions. Include a consumer override and the affected document/RTL states. |
| Cross-document registration or a particular mixed-style composition mechanism | Reuse shared registration coverage. Add a component-specific test only for an uncovered registration or composition risk. A small fixture stylesheet can test that mechanism; pair it with a real-style check. |

Jest mocks stylesheet imports. Public-class assertions can protect a compatibility contract; private module-class assertions establish wiring only. Neither proves that the real CSS loads or wins. Do not add class assertions or snapshots solely to mirror the implementation. Do not inject the desired production selector into a test and claim it protects that selector: the test would still pass if the SCSS rule were deleted. This distinction led to removing tests in [#81792](https://github.com/WordPress/gutenberg/pull/81792#discussion_r3811746653).

Keep new tests focused on the migrated component's integration. A wrapper test can protect its `as`, ref, or prop forwarding even when the shared helper is already tested. Do not copy PolymorphicElement's entire filtering suite into every wrapper, duplicate a full editor setup for a small assertion, or introduce a new Storybook testing convention just for the migration. Check the relevant states and combinations from the contract audit; do not generate every prop combination or supported tag. When a real-style assertion is unavailable, state the gap and give reproducible manual steps.

## Complete the migration

Remove obsolete Emotion imports, files, lint/type suppressions, and utilities that become unused because of this migration. Search all consumers before deleting shared constants. Preserve useful comments explaining layout calculations or compatibility workarounds. Leave unrelated cleanup and global Emotion dependencies, Babel wiring, serializers, `useCx`, and the `rtl` utility until their remaining users are gone.

Follow [worktree setup](/docs/contributors/code/getting-started-with-code-contribution.md#set-up-each-worktree) and read the [testing overview](/docs/contributors/code/testing-overview.md) before adding tests. New tests use Vitest; the [migration manifest](/test/unit/test-migration.json) identifies legacy tests still owned by Jest. From the repository root, use the appropriate focused command below, then run lint and the repository gates:

```sh
npm run test:unit -- <legacy-jest-test-path> --runInBand
npm run test:unit:vitest -- <vitest-test-path>
npm run lint:js -- <changed-js-files>
npm run lint:css
npm run typecheck
npm run build
npm run test:unit:update
npm run test:unit:vitest:update
git diff --check
```

The snapshot updates are for the whole repository because downstream consumers can change. Jest and Vitest own separate suites, so neither command covers both. Review every snapshot change for removed or duplicated public classes, changed elements, forwarded props, and consumer output. Do not accept a snapshot solely because Emotion classes disappeared. Rerun the exact failing file or shard before attributing a broad failure to the migration.

For generated-file verification, start from a clean committed worktree and run the applicable generators and suppression updates. `npm run other:check-local-changes` runs the documentation and theme generators through its npm prehook, then checks the unstaged diff. It does not run every generator or suppression update; consult the current [static-checks workflow](/.github/workflows/static-checks.yml) for those required by the migration. Inspect generated changes before staging them, since staged changes are invisible to the checker. Commit required updates, then repeat the applicable generation and check commands from the clean worktree.

Recheck the final selectors and consumers after the last edit or rebase; a previous visual check does not cover a later specificity change. Preserve newer trunk changes, such as focus-ring updates, when moving declarations out of an old style file.

Follow [package changelog guidance](/docs/contributors/code/managing-packages.md). For production migrations, use the current unreleased section and this PR's link. The merged migrations record the `cx()` composition limitation under **Breaking Changes**, even when normal component usage is visually unchanged. Do not copy an early pilot's `Internal` entry as the only release note. Record any separately agreed behavior change and its verification independently, as #80715 did for Reset focus retention.

## Reference migrations

Choose an example for the risk in the current migration, then check it against current source. The full migration history is maintained in [#66806](https://github.com/WordPress/gutenberg/issues/66806).

| Migration risk | Merged example | What to inspect |
| --- | --- | --- |
| Polymorphic wrappers | View, [#79443](https://github.com/WordPress/gutenberg/pull/79443) | Shared polymorphic replacement, legacy `css` no-op, and downstream consumers. |
| Dynamic spacing | Spacer, [#79449](https://github.com/WordPress/gutenberg/pull/79449) | Nested custom-property resets and shorthand/longhand fallback. |
| Selector specificity | Divider, [#79444](https://github.com/WordPress/gutenberg/pull/79444), and [#79534](https://github.com/WordPress/gutenberg/pull/79534) | Orientation selectors and the correction that restored consumer overrides. |
| Mixed Emotion composition | Border controls, [#80437](https://github.com/WordPress/gutenberg/pull/80437) | Overrides, CSS-wide values, and the linked-control gutter. |
| Root and iframe delivery | Scrollable, [#80694](https://github.com/WordPress/gutenberg/pull/80694) | CardBody height and stylesheet insertion order in each document. |
