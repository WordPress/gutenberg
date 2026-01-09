/**
 * Internal dependencies
 */
import isStagedId, { STAGED_ID_PREFIX } from '../is-staged-id';

describe( 'isStagedId', () => {
	it( 'returns true for staged IDs', () => {
		expect( isStagedId( `${ STAGED_ID_PREFIX }test-uuid` ) ).toBe( true );
		expect( isStagedId( '__staged__abc-123' ) ).toBe( true );
	} );

	it( 'returns false for regular string IDs', () => {
		expect( isStagedId( 'some-slug' ) ).toBe( false );
		expect( isStagedId( 'page' ) ).toBe( false );
	} );

	it( 'returns false for numeric IDs', () => {
		expect( isStagedId( 123 ) ).toBe( false );
		expect( isStagedId( 0 ) ).toBe( false );
	} );

	it( 'returns false for numeric string IDs', () => {
		expect( isStagedId( '123' ) ).toBe( false );
	} );

	it( 'returns false for null and undefined', () => {
		expect( isStagedId( null ) ).toBe( false );
		expect( isStagedId( undefined ) ).toBe( false );
	} );
} );

describe( 'STAGED_ID_PREFIX', () => {
	it( 'exports the correct prefix', () => {
		expect( STAGED_ID_PREFIX ).toBe( '__staged__' );
	} );
} );
