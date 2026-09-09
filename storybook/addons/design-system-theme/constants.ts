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
