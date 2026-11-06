import type { GapSize } from '@wordpress/theme';

// Static map so that the build-time token fallback plugin can inject fallback
// values into each `var()` call.
const GAP_TOKENS: Record< GapSize, string > = {
	xs: 'var(--wpds-dimension-gap-xs)',
	sm: 'var(--wpds-dimension-gap-sm)',
	md: 'var(--wpds-dimension-gap-md)',
	lg: 'var(--wpds-dimension-gap-lg)',
	xl: 'var(--wpds-dimension-gap-xl)',
	'2xl': 'var(--wpds-dimension-gap-2xl)',
	'3xl': 'var(--wpds-dimension-gap-3xl)',
};

/**
 * The inline style that declares a gap step on a surface root: the step's
 * token on `--wp-grid-gap`, which the stylesheet resolves. Empty for an
 * absent or unknown step, which leaves the property to an ancestor or to
 * the stylesheet default.
 *
 * @param gap Gap step.
 * @return Style to spread on the root.
 */
export function gapStyle( gap?: GapSize ): React.CSSProperties {
	const token = gap === undefined ? undefined : GAP_TOKENS[ gap ];
	return token ? ( { '--wp-grid-gap': token } as React.CSSProperties ) : {};
}

/**
 * Reads the computed `column-gap` of a surface root in pixels.
 *
 * @param element Surface root.
 * @return The gap in pixels, or `undefined` when there is none to read.
 */
export function readComputedGap( element: Element ): number | undefined {
	const parsed = Number.parseFloat(
		window.getComputedStyle( element ).columnGap
	);
	return Number.isFinite( parsed ) && parsed > 0 ? parsed : undefined;
}
