import { renderHook } from '@testing-library/react';
import { getContrast } from '../color-ramps/lib/color-utils';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

const MINIMUM_TEXT_CONTRAST = 4.5;
const CUSTOM_PRIMARY = '#0057b8';
const CUSTOM_BACKGROUND = '#f6f3ef';

const THEME_PROVIDER_STYLE_CASES = [
	{
		name: 'default seed colors',
		settings: undefined,
	},
	{
		name: 'custom seed colors',
		settings: {
			color: {
				primary: CUSTOM_PRIMARY,
				background: CUSTOM_BACKGROUND,
			},
		},
	},
] as const;

const CONTRAST_PAIRS = [
	{
		background: '--wpds-color-background-surface-neutral',
		foreground: '--wpds-color-foreground-content-neutral',
	},
	{
		background: '--wpds-color-background-surface-neutral-strong',
		foreground: '--wpds-color-foreground-content-neutral',
	},
	{
		background: '--wpds-color-background-surface-neutral-weak',
		foreground: '--wpds-color-foreground-content-neutral',
	},
	{
		background: '--wpds-color-background-surface-neutral',
		foreground: '--wpds-color-foreground-content-neutral-weak',
	},
	{
		background: '--wpds-color-background-surface-info',
		foreground: '--wpds-color-foreground-content-info',
	},
	{
		background: '--wpds-color-background-surface-info-weak',
		foreground: '--wpds-color-foreground-content-info-weak',
	},
	{
		background: '--wpds-color-background-surface-success',
		foreground: '--wpds-color-foreground-content-success',
	},
	{
		background: '--wpds-color-background-surface-success-weak',
		foreground: '--wpds-color-foreground-content-success-weak',
	},
	{
		background: '--wpds-color-background-surface-warning',
		foreground: '--wpds-color-foreground-content-warning',
	},
	{
		background: '--wpds-color-background-surface-warning-weak',
		foreground: '--wpds-color-foreground-content-warning-weak',
	},
	{
		background: '--wpds-color-background-surface-caution',
		foreground: '--wpds-color-foreground-content-caution',
	},
	{
		background: '--wpds-color-background-surface-caution-weak',
		foreground: '--wpds-color-foreground-content-caution-weak',
	},
	{
		background: '--wpds-color-background-surface-error',
		foreground: '--wpds-color-foreground-content-error',
	},
	{
		background: '--wpds-color-background-surface-error-weak',
		foreground: '--wpds-color-foreground-content-error-weak',
	},
	{
		background: '--wpds-color-background-interactive-brand-strong',
		foreground: '--wpds-color-foreground-interactive-brand-strong',
	},
	{
		background: '--wpds-color-background-interactive-brand-strong-active',
		foreground: '--wpds-color-foreground-interactive-brand-strong-active',
	},
	{
		background: '--wpds-color-background-interactive-error-strong',
		foreground: '--wpds-color-foreground-interactive-error-strong',
	},
	{
		background: '--wpds-color-background-interactive-error-strong-active',
		foreground: '--wpds-color-foreground-interactive-error-strong-active',
	},
	{
		background: '--wpds-color-background-interactive-neutral-strong',
		foreground: '--wpds-color-foreground-interactive-neutral-strong',
	},
	{
		background: '--wpds-color-background-interactive-neutral-strong-active',
		foreground: '--wpds-color-foreground-interactive-neutral-strong-active',
	},
] as const;

function readToken(
	styles: Record< string, string | number | undefined >,
	token: string
) {
	const value = styles[ token ];
	if ( typeof value !== 'string' || value === '' ) {
		throw new Error( `Missing semantic color token: ${ token }` );
	}
	return value;
}

describe( 'semantic color contrast', () => {
	it.each( THEME_PROVIDER_STYLE_CASES )(
		'keeps critical foreground/background pairs above WCAG AA text contrast with $name',
		( { settings } ) => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( settings )
			);
			const styles = result.current.themeProviderStyles as Record<
				string,
				string | number | undefined
			>;

			CONTRAST_PAIRS.forEach( ( { foreground, background } ) => {
				const foregroundValue = readToken( styles, foreground );
				const backgroundValue = readToken( styles, background );

				expect(
					getContrast( foregroundValue, backgroundValue )
				).toBeGreaterThanOrEqual( MINIMUM_TEXT_CONTRAST );
			} );
		}
	);
} );
