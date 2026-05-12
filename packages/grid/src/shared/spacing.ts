/**
 * Discriminated key into the design-system gap scale. Maps to the
 * matching `--wpds-dimension-gap-{size}` token at render time so the
 * density chosen by an ancestor `ThemeProvider` flows in via the CSS
 * cascade.
 */
export type DashboardGridSpacing =
	| 'xs'
	| 'sm'
	| 'md'
	| 'lg'
	| 'xl'
	| '2xl'
	| '3xl';

/**
 * Pixel fallbacks for the gap scale at `default` density. Used for
 * runtime math (responsive column derivation, resize stepping) where a
 * numeric value is required before the CSS cascade resolves. Under
 * non-default density the rendered gap may differ from these values;
 * the math is reconciled by the next `ResizeObserver` tick after the
 * cascade settles.
 */
export const SPACING_PX: Record< DashboardGridSpacing, number > = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	'2xl': 24,
	'3xl': 32,
};

/**
 * Static `var()` expressions for each spacing size. Kept as literal
 * strings so static analysis can resolve them and the design-system
 * fallback plugin can inject pixel fallbacks at build time.
 */
const SPACING_TOKEN_VARS: Record< DashboardGridSpacing, string > = {
	xs: 'var(--wpds-dimension-gap-xs)',
	sm: 'var(--wpds-dimension-gap-sm)',
	md: 'var(--wpds-dimension-gap-md)',
	lg: 'var(--wpds-dimension-gap-lg)',
	xl: 'var(--wpds-dimension-gap-xl)',
	'2xl': 'var(--wpds-dimension-gap-2xl)',
	'3xl': 'var(--wpds-dimension-gap-3xl)',
};

/**
 * CSS `var()` expression for a given spacing size. Emitted as the
 * inline `gap` so density propagates automatically through the gap
 * tokens.
 *
 * @param spacing Spacing size key.
 */
export function getSpacingTokenVar( spacing: DashboardGridSpacing ): string {
	return SPACING_TOKEN_VARS[ spacing ];
}
