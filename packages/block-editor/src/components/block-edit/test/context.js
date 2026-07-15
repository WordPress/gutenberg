/**
 * Internal dependencies
 */
import { getMayDisplayParentControls } from '../context';

describe( 'getMayDisplayParentControls', () => {
	it( 'does not expose parent controls when no child block is selected', () => {
		expect( getMayDisplayParentControls( true, false ) ).toBe( false );
		expect( getMayDisplayParentControls( [ 'media' ], false ) ).toBe(
			false
		);
	} );

	it( 'preserves boolean parent control exposure when a child block is selected', () => {
		expect( getMayDisplayParentControls( true, true ) ).toBe( true );
		expect( getMayDisplayParentControls( false, true ) ).toBe( false );
	} );

	it( 'preserves granular parent control exposure when a child block is selected', () => {
		expect( getMayDisplayParentControls( [ 'media' ], true ) ).toEqual( [
			'media',
		] );
	} );
} );
