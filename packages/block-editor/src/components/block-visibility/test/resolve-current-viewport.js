/**
 * Internal dependencies
 */
import { resolveCurrentViewport } from '../resolve-current-viewport';

describe( 'resolveCurrentViewport', () => {
	it( 'returns mobile for Mobile device preview', () => {
		expect( resolveCurrentViewport( 'mobile', true, true ) ).toBe(
			'mobile'
		);
	} );

	it( 'returns tablet for Tablet device preview', () => {
		expect( resolveCurrentViewport( 'tablet', true, true ) ).toBe(
			'tablet'
		);
	} );

	it( 'falls back to mobile in Desktop preview on narrow width', () => {
		expect( resolveCurrentViewport( 'desktop', false, false ) ).toBe(
			'mobile'
		);
	} );

	it( 'falls back to tablet in Desktop preview on medium width', () => {
		expect( resolveCurrentViewport( 'desktop', true, false ) ).toBe(
			'tablet'
		);
	} );

	it( 'returns desktop in Desktop preview on wide width', () => {
		expect( resolveCurrentViewport( 'desktop', true, true ) ).toBe(
			'desktop'
		);
	} );
} );
