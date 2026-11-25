import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { getAdminThemeColors } from '@wordpress/admin-ui';
import { ThemeProvider } from '@wordpress/theme';

// Largest difference allowed in each sRGB channel, out of 255.
const TOLERANCE = 4;

function hexToChannels( hex: string ) {
	return [ 1, 3, 5 ].map( ( i ) => parseInt( hex.slice( i, i + 2 ), 16 ) );
}

describe( 'admin color scheme sidebar', () => {
	afterEach( () => {
		document.body.className = '';
	} );

	// The sidebar should stay close to the `$base-color` of the Core scheme.
	it.each( [
		{ scheme: 'blue', core: '#245278' },
		{ scheme: 'sunrise', core: '#8a312d' },
	] )(
		'matches the Core sidebar color in the $scheme scheme',
		async ( { scheme, core } ) => {
			document.body.className = `admin-color-${ scheme }`;

			await render(
				<ThemeProvider color={ getAdminThemeColors() }>
					<div
						style={ {
							background:
								'var(--wpds-color-background-surface-neutral-weak)',
						} }
					>
						sidebar
					</div>
				</ThemeProvider>
			);

			const sidebarColor = getComputedStyle(
				screen.getByText( 'sidebar' )
			).backgroundColor;
			const actual = sidebarColor.match( /\d+/g )!.map( Number );

			hexToChannels( core ).forEach( ( channel, index ) => {
				expect(
					Math.abs( channel - actual[ index ] )
				).toBeLessThanOrEqual( TOLERANCE );
			} );
		}
	);
} );
