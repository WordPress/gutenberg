/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import { updateFootnotesFromMeta } from '../';

// The real implementation logs once per distinct message, which would make
// per-case assertions depend on the order the cases run in.
jest.mock( '@wordpress/warning' );

describe( 'updateFootnotesFromMeta', () => {
	const blocks = [];

	beforeEach( () => {
		warning.mockClear();
	} );

	it( 'returns the blocks untouched when there is no meta', () => {
		expect( updateFootnotesFromMeta( blocks, undefined ) ).toEqual( {
			blocks,
		} );
	} );

	it( 'returns the blocks untouched when the meta is not registered', () => {
		expect( updateFootnotesFromMeta( blocks, {} ) ).toEqual( { blocks } );
	} );

	it( 'accepts an empty footnotes array without warning', () => {
		expect(
			updateFootnotesFromMeta( blocks, { footnotes: '[]' } )
		).toEqual( { blocks } );
		expect( warning ).not.toHaveBeenCalled();
	} );

	describe( 'meta this code did not write', () => {
		// Each of these threw before being guarded, inside a store subscriber
		// where no error boundary catches it, so the user's edit was dropped
		// and the post silently stopped saving.
		it.each( [
			[ 'valid JSON holding null', 'null' ],
			[ 'valid JSON holding a number', '5' ],
			[ 'valid JSON holding an object', '{"a":1}' ],
			[ 'valid JSON holding a string', '"footnotes"' ],
			[ 'malformed JSON', '{' ],
			[ 'a truncated array', '[{"id":"a","content":"x"' ],
			[ 'not JSON at all', 'footnotes' ],
		] )( 'does not throw on %s', ( _label, footnotes ) => {
			expect( () =>
				updateFootnotesFromMeta( blocks, { footnotes } )
			).not.toThrow();
			expect( warning ).toHaveBeenCalled();
		} );

		it( 'treats an unreadable value as no footnotes', () => {
			expect(
				updateFootnotesFromMeta( blocks, { footnotes: 'null' } )
			).toEqual( { blocks } );
		} );
	} );
} );
