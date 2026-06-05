import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../../lock-unlock';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

/**
 * Get a CSS custom property value from the body element.
 *
 * @param propertyName The CSS custom property name (e.g., '--wp-admin-color-highlight').
 * @return The property value or undefined if not set.
 */
function getCSSCustomProperty( propertyName: string ): string | undefined {
	const value = getComputedStyle( document.body )
		.getPropertyValue( propertyName )
		.trim();
	return value || undefined;
}

/**
 * Get the admin theme primary color from Core's CSS custom properties.
 *
 * @return The highlight color or undefined.
 */
export function getAdminThemePrimaryColor(): string | undefined {
	return getCSSCustomProperty( '--wp-admin-color-highlight' );
}

/**
 * Get the admin theme background color from Core's CSS custom properties.
 *
 * @return The menu background color or undefined.
 */
export function getAdminThemeBgColor(): string | undefined {
	return getCSSCustomProperty( '--wp-admin-color-menu-background' );
}

export function UserThemeProvider( {
	color,
	...restProps
}: React.ComponentProps< typeof ThemeProvider > ) {
	const primary = getAdminThemePrimaryColor();
	const bg = getAdminThemeBgColor();

	return (
		<ThemeProvider { ...restProps } color={ { primary, bg, ...color } } />
	);
}
