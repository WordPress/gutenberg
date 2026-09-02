---
name: wordpress-ui-css-variable-fallbacks
description: Rewrite and verify `@wordpress/ui` public `--wp-ui-*` CSS custom properties so defaults are `var()` fallbacks, not assignments on the consuming class. Use when adding, changing, or reviewing `@wordpress/ui` stylesheets, `--wp-ui-*` variables, CSS theming overrides, or ancestor style customization.
---

# Public `--wp-ui-*` CSS variable fallbacks

Source of truth: [packages/ui/CONTRIBUTING.md](../../../packages/ui/CONTRIBUTING.md) (Public `--wp-ui-*` defaults).

`--wp-ui-*` is public API. Custom properties inherit. An assignment on the class that uses the variable overwrites an ancestor value, so consumers cannot theme from a wrapper.

## Rule

Put the default in the `var()` fallback. Do not assign `--wp-ui-*` on the consuming class.

```css
/* Wrong */
.root {
	--wp-ui-checkbox-input-size: 16px;
	width: var( --wp-ui-checkbox-input-size );
}

/* Right */
.root {
	width: var( --wp-ui-checkbox-input-size, 16px );
	height: var( --wp-ui-checkbox-input-size, 16px );
}
```

Never write `--wp-ui-x: var(--wp-ui-x, fallback)`. That is a cycle. The specified value on the element refers to itself, not to the inherited value.

Private `--_*` and `--_gcd-*` assignments are allowed. Bridge public vars into them with a fallback:

```css
--_gcd-button-font-size: var(
	--wp-ui-button-font-size,
	var( --wpds-typography-font-size-md )
);
```

If one public var is read many times, a private alias is allowed:

```css
--_checkbox-size: var( --wp-ui-checkbox-input-size, 16px );
width: var( --_checkbox-size );
height: var( --_checkbox-size );
```

## Rewrite

1. Find `--wp-ui-*` assignments with the checker.
2. For each assignment that encodes a **default**, delete it.
3. At every `var(--wp-ui-x)` use site, pass the former value as the fallback.
4. Repeat fallbacks. Do not reintroduce an assignment to "share" the default.
5. Leave `--wpds-*` tokens as they are. Change only how `--wp-ui-*` defaults are supplied.

Same-element **overrides** (a composition or variant that must win over the default, such as `IconButton` setting `--wp-ui-button-aspect-ratio`) still assign the public var today. Do not invent a new pattern for those in a drive-by. Convert defaults first. Stop and ask if a file is only variant/composition reassignments.

## Verify

From the repo root:

```bash
node .agents/skills/wordpress-ui-css-variable-fallbacks/scripts/check-wp-ui-var-assignments.mjs --self-test
node .agents/skills/wordpress-ui-css-variable-fallbacks/scripts/check-wp-ui-var-assignments.mjs <touched-stylesheet>
```

The second command must print `no --wp-ui-* assignments` and exit 0 for files whose defaults you converted.

Then prove cascade in Storybook (Font only and WordPress global CSS):

1. Default look is unchanged.
2. A wrapper with `--wp-ui-<name>: <other>` changes the property. The same wrapper did nothing before the rewrite.

No args prints the remaining package inventory and exits 0.
