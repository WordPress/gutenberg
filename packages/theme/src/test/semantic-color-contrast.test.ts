import { renderHook } from '@testing-library/react';
import { DEFAULT_SEED_COLORS } from '../color-ramps';
import { getContrast } from '../color-ramps/lib/color-utils';
import { SEMANTIC_COLOR_CONTRAST_PAIRS } from '../semantic-color-contrast-pairs';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

const MINIMUM_TEXT_CONTRAST = 4.5;
const CUSTOM_PRIMARY = '#0057b8';
const CUSTOM_BACKGROUND = '#f6f3ef';

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

const CONTRAST_PAIRS = SEMANTIC_COLOR_CONTRAST_PAIRS.map(
	( { foreground, background } ) => ( {
		foreground: `--wpds-color-${ foreground.replaceAll( '.', '-' ) }`,
		background: `--wpds-color-${ background.replaceAll( '.', '-' ) }`,
	} )
);

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
