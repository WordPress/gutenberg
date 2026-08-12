import { renderHook } from '@testing-library/react';
import { ColorSpace, deltaEOK, parse, sRGB } from 'colorjs.io/fn';
import { getContrast } from '../color-ramps/lib/color-utils';
import { useThemeProviderStyles } from '../use-theme-provider-styles';
import { DEFAULT_SEED_COLORS } from '../color-ramps';

const MINIMUM_TEXT_CONTRAST = 4.5;
const MINIMUM_STATE_DELTA_E_OK = 0.04;
const MINIMUM_LIGHT_STATE_DELTA_E_OK = 0.16;
const TARGET_STATE_CONTRAST = 1.5;
const CUSTOM_PRIMARY = '#0057b8';
const CUSTOM_BACKGROUND = '#f6f3ef';

ColorSpace.register( sRGB );

const THEME_PROVIDER_STYLE_CASES = [
	{
		name: 'default seed colors',
		settings: {
			color: {
				primary: DEFAULT_SEED_COLORS.primary,
				background: DEFAULT_SEED_COLORS.background,
			},
		},
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

const BACKGROUND_COLOR_CASES = [
	{ name: 'WordPress light', background: '#f8f8f8' },
	{ name: 'WordPress dark', background: '#1e1e1e' },
	{ name: 'Fresh', background: '#25292b' },
	{ name: 'Light', background: '#eaeeed' },
	{ name: 'Blue', background: '#3876a8' },
	{ name: 'Coffee', background: '#5b534d' },
	{ name: 'Ectoplasm', background: '#4f386e' },
	{ name: 'Ocean', background: '#5f787f' },
	{ name: 'Midnight', background: '#3d4042' },
	{ name: 'Sunrise', background: '#cc4541' },
] as const;

const LIGHT_BACKGROUND_COLOR_CASES = [
	{ name: 'WordPress light', background: '#f8f8f8' },
	{ name: 'Light', background: '#eaeeed' },
] as const;

const NEUTRAL_INTERACTIVE_FOREGROUNDS = [
	'--wpds-color-foreground-interactive-neutral',
	'--wpds-color-foreground-interactive-neutral-active',
] as const;

const SUPPORTED_NEUTRAL_SURFACES = [
	'--wpds-color-background-surface-neutral-weak',
	'--wpds-color-background-surface-neutral',
	'--wpds-color-background-surface-neutral-strong',
	'--wpds-color-background-interactive-neutral-weak-active',
	'--wpds-color-background-interactive-neutral-strong-disabled',
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

	it.each( BACKGROUND_COLOR_CASES )(
		'keeps normal neutral interactive foregrounds readable across supported surfaces with $name',
		( { background } ) => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: {
						background,
						primary: DEFAULT_SEED_COLORS.primary,
					},
				} )
			);
			const styles = result.current.themeProviderStyles as Record<
				string,
				string | number | undefined
			>;

			NEUTRAL_INTERACTIVE_FOREGROUNDS.forEach( ( foreground ) => {
				SUPPORTED_NEUTRAL_SURFACES.forEach( ( surface ) => {
					expect(
						getContrast(
							readToken( styles, foreground ),
							readToken( styles, surface )
						)
					).toBeGreaterThanOrEqual( MINIMUM_TEXT_CONTRAST );
				} );
			} );
		}
	);

	it.each( BACKGROUND_COLOR_CASES )(
		'targets perceptible contrast between normal neutral interactive foreground states with $name',
		( { background } ) => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: {
						background,
						primary: DEFAULT_SEED_COLORS.primary,
					},
				} )
			);
			const styles = result.current.themeProviderStyles as Record<
				string,
				string | number | undefined
			>;
			const resting = readToken(
				styles,
				'--wpds-color-foreground-interactive-neutral'
			);
			const active = readToken(
				styles,
				'--wpds-color-foreground-interactive-neutral-active'
			);
			const stateContrast = getContrast( resting, active );
			const meetsTargetOrReachedEndpoint =
				stateContrast >= TARGET_STATE_CONTRAST ||
				[ '#000', '#fff' ].includes( active );

			expect( meetsTargetOrReachedEndpoint ).toBe( true );

			expect(
				deltaEOK( parse( resting ), parse( active ) )
			).toBeGreaterThanOrEqual( MINIMUM_STATE_DELTA_E_OK );
		}
	);

	it.each( LIGHT_BACKGROUND_COLOR_CASES )(
		'increases perceptual separation between normal neutral interactive foreground states with $name',
		( { background } ) => {
			const { result } = renderHook( () =>
				useThemeProviderStyles( {
					color: {
						background,
						primary: DEFAULT_SEED_COLORS.primary,
					},
				} )
			);
			const styles = result.current.themeProviderStyles as Record<
				string,
				string | number | undefined
			>;
			const resting = readToken(
				styles,
				'--wpds-color-foreground-interactive-neutral'
			);
			const active = readToken(
				styles,
				'--wpds-color-foreground-interactive-neutral-active'
			);

			expect(
				deltaEOK( parse( resting ), parse( active ) )
			).toBeGreaterThanOrEqual( MINIMUM_LIGHT_STATE_DELTA_E_OK );
		}
	);
} );
