import { renderHook } from '@testing-library/react';
import {
	getSemanticColorCustomProperty,
	MINIMUM_TEXT_CONTRAST,
	SEMANTIC_COLOR_CONTRAST_PAIRS,
} from '../semantic-color-contrast-pairs';
import { getContrast } from '../color-ramps/lib/color-utils';
import { useThemeProviderStyles } from '../use-theme-provider-styles';

const CUSTOM_PRIMARY = '#0057b8';
const CUSTOM_BACKGROUND = '#f6f3ef';

const CONTRAST_PAIRS = SEMANTIC_COLOR_CONTRAST_PAIRS.map(
	( { foreground, background } ) => ( {
		foreground: getSemanticColorCustomProperty( foreground ),
		background: getSemanticColorCustomProperty( background ),
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
	it( 'keeps critical foreground/background pairs above WCAG AA text contrast with custom seed colors', () => {
		const { result } = renderHook( () =>
			useThemeProviderStyles( {
				color: {
					primary: CUSTOM_PRIMARY,
					background: CUSTOM_BACKGROUND,
				},
			} )
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
	} );
} );
