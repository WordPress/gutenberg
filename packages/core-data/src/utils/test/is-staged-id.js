/**
 * Internal dependencies
 */
import { isStagedId, STAGED_ID_PREFIX } from '../is-staged-id';

describe( 'isStagedId', () => {
	it( 'returns true for staged IDs', () => {
		expect( isStagedId( `${ STAGED_ID_PREFIX }test-uuid` ) ).toBe( true );
		expect( isStagedId( '__staged__abc-123' ) ).toBe( true );
	} );

	it( 'returns false for regular string IDs', () => {
		expect( isStagedId( 'some-slug' ) ).toBe( false );
		expect( isStagedId( 'page' ) ).toBe( false );
	} );
} );
