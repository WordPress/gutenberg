export const LIGHT_THEME_COLORS = {
	primary: '#3858e9',
	background: '#fcfcfc',
} as const;

export const DARK_THEME_COLORS = {
	primary: LIGHT_THEME_COLORS.primary,
	background: '#1e1e1e',
} as const;

export type ColorTheme = 'light' | 'dark' | 'custom';

const isHexColor = ( value: unknown ): value is string =>
	typeof value === 'string' && /^#[\da-f]{6}$/i.test( value );

export function normalizeColorTheme( value: unknown ): ColorTheme {
	return value === 'dark' || value === 'custom' ? value : 'light';
}

export function getCustomThemeColors( primary: unknown, background: unknown ) {
	return {
		primary: isHexColor( primary ) ? primary : LIGHT_THEME_COLORS.primary,
		background: isHexColor( background )
			? background
			: LIGHT_THEME_COLORS.background,
	};
}

/**
 * Mirrors `contrastLevels` from `@wordpress/theme`. The manager is a separate
 * pre-built bundle and can't import the package; a unit test keeps the two in
 * sync.
 */
export const CONTRAST_LEVELS = {
	minimum: -1,
	standard: 0,
	enhanced: 1,
} as const;

/**
 * Parses the contrast global, which arrives as a string from the URL.
 *
 * @param value The raw global value.
 * @return A contrast value rounded to 0.1 in -1..1, or 0.
 */
export function normalizeContrast( value: unknown ): number {
	const parsed = typeof value === 'number' ? value : Number( value );
	if ( ! Number.isFinite( parsed ) ) {
		return 0;
	}
	const rounded = Math.round( Math.max( -1, Math.min( 1, parsed ) ) * 10 );
	return rounded === 0 ? 0 : rounded / 10;
}
