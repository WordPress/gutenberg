export const LIGHT_THEME_COLORS = {
	primary: '#3858e9',
	background: '#fcfcfc',
} as const;

export const DARK_THEME_COLORS = {
	primary: LIGHT_THEME_COLORS.primary,
	background: '#1e1e1e',
} as const;

export const SIDEBAR_THEME_PRESETS = [
	{
		id: 'fresh',
		title: 'Fresh',
		colors: { primary: '#3858e9', background: '#25292b' },
	},
	{
		id: 'blue',
		title: 'Blue',
		colors: { primary: '#437aa8', background: '#3876a8' },
	},
	{
		id: 'ectoplasm',
		title: 'Ectoplasm',
		colors: { primary: '#646c3e', background: '#4f386e' },
	},
] as const;

export type ColorTheme = 'light' | 'dark' | 'custom';

const isHexColor = ( value: unknown ): value is string =>
	typeof value === 'string' && /^#[\da-f]{6}$/i.test( value );

export function getColorTheme( value: unknown ): ColorTheme {
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

export function getSidebarThemePreset( value: unknown ) {
	return (
		SIDEBAR_THEME_PRESETS.find( ( preset ) => preset.id === value ) ??
		SIDEBAR_THEME_PRESETS[ 0 ]
	);
}
