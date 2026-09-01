/* eslint-disable @wordpress/no-ds-tokens -- This file is the JS counterpart of
   theme-variables.scss and the package's single mapping to the design system.
   The rule guards against bare `--wpds-*` references, which the build can't
   inject fallbacks into for Emotion/JS files; here every reference carries an
   explicit fallback, so that concern doesn't apply.

   IMPORTANT: because this file's source contains `--wpds-` text, the
   design-system fallback build plugin claims it (it matches any file whose
   source includes `--wpds-`, comments included) and, in doing so, displaces
   the Emotion transform for this file. That is harmless ONLY because this file
   holds plain value constants and no Emotion `css`/styled component selectors.
   Do not add any here: a co-located component selector would silently fail to
   compile and break the build, with no lint signal (see #79245). Keep this
   file selector-free — define styles elsewhere and consume these constants. */

const white = '#fff';

// Matches the grays in @wordpress/base-styles
const GRAY = {
	900: '#1e1e1e',
	800: '#2f2f2f',
	/** Meets 4.6:1 text contrast against white. */
	700: '#757575',
	/** Meets 3:1 UI or large text contrast against white. */
	600: '#949494',
	400: '#ccc',
	/** Used for most borders. */
	300: '#ddd',
	/** Used sparingly for light borders. */
	200: '#e0e0e0',
	/** Used for light gray backgrounds. */
	100: '#f0f0f0',
};

// Matches @wordpress/base-styles
const ALERT = {
	yellow: '#f0b849',
	red: '#d94f4f',
	green: '#4ab866',
};

// Should match packages/components/src/utils/theme-variables.scss.
//
// Mirrors the Sass structure: each non-accent value resolves through a design
// system (`--wpds-*`) token, then a hardcoded fallback. The hardcoded values
// match what the design-system fallback plugin injects into the Sass version,
// so JS behaves consistently with the Sass variables. Keep both the token
// references and the fallbacks in sync with the Sass version.
const THEME = {
	accent: `var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9))`,
	accentDarker10: `var(--wp-components-color-accent-darker-10, var(--wp-admin-theme-color-darker-10, #2145e6))`,
	accentDarker20: `var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6))`,
	/** Used when placing text on the accent color. */
	accentInverted: `var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff))`,

	background: `var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff))`,

	foreground: `var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e))`,
	/** Used when placing text on the foreground color. */
	foregroundInverted: `var(--wp-components-color-foreground-inverted, var(--wpds-color-background-surface-neutral, #fcfcfc))`,

	gray: {
		/** @deprecated Use `COLORS.theme.foreground` instead. */
		900: `var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e))`,
		800: `var(--wp-components-color-gray-800, var(--wpds-color-foreground-content-neutral, #1e1e1e))`,
		700: `var(--wp-components-color-gray-700, var(--wpds-color-foreground-content-neutral-weak, #707070))`,
		600: `var(--wp-components-color-gray-600, var(--wpds-color-stroke-interactive-neutral, #8d8d8d))`,
		400: `var(--wp-components-color-gray-400, var(--wpds-color-stroke-interactive-neutral, #8d8d8d))`,
		300: `var(--wp-components-color-gray-300, var(--wpds-color-stroke-surface-neutral, #dbdbdb))`,
		200: `var(--wp-components-color-gray-200, var(--wpds-color-stroke-surface-neutral, #dbdbdb))`,
		100: `var(--wp-components-color-gray-100, var(--wpds-color-background-surface-neutral, #fcfcfc))`,
	},
};

/* eslint-enable @wordpress/no-ds-tokens */

const UI = {
	background: THEME.background,
	backgroundDisabled: THEME.gray[ 100 ],
	border: THEME.gray[ 600 ],
	borderHover: THEME.gray[ 700 ],
	borderFocus: THEME.accent,
	borderDisabled: THEME.gray[ 400 ],
	textDisabled: THEME.gray[ 600 ],

	// Matches @wordpress/base-styles
	darkGrayPlaceholder: `color-mix(in srgb, ${ THEME.foreground }, transparent 38%)`,
	lightGrayPlaceholder: `color-mix(in srgb, ${ THEME.background }, transparent 35%)`,
};

export const COLORS = Object.freeze( {
	/**
	 * The main gray color object.
	 *
	 * @deprecated Use semantic aliases in `COLORS.ui` or theme-ready variables in `COLORS.theme.gray`.
	 */
	gray: GRAY, // TODO: Stop exporting this when everything is migrated to `theme` or `ui`
	/**
	 * @deprecated Prefer theme-ready variables in `COLORS.theme`.
	 */
	white,
	alert: ALERT,
	/**
	 * Theme-ready variables with fallbacks.
	 *
	 * Prefer semantic aliases in `COLORS.ui` when applicable.
	 */
	theme: THEME,
	/**
	 * Semantic aliases (prefer these over raw variables when applicable).
	 */
	ui: UI,
} );

export default COLORS;
