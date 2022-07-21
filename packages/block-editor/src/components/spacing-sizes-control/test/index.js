/**
 * Internal dependencies
 */
import { isValueSpacingPreset } from '../utils';

describe( 'isValueSpacingPreset', () => {
	it( 'should return true if value is string in spacing presets var format', () => {
		expect( isValueSpacingPreset( 'var:preset|spacing|20' ) ).toBe( true );
	} );
	it( 'should return false if value is not a string in spacing presets var format', () => {
		expect( isValueSpacingPreset( '30px' ) ).toBe( false );
	} );
} );
