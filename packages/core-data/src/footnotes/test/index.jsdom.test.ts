import { beforeEach, describe, expect, it, vi } from 'vitest';
import warning from '@wordpress/warning';
import type { Block } from '@wordpress/blocks';
import { updateFootnotesFromMeta } from '../';
import getFootnotesOrder from '../get-footnotes-order';

// The real implementation logs once per distinct message, which would make
// per-case assertions depend on the order the cases run in.
vi.mock( import( '@wordpress/warning' ) );

// Lets a test set the footnotes the blocks reference without building blocks.
vi.mock( import( '../get-footnotes-order' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return { default: vi.fn( actual.default ) };
} );

describe( 'updateFootnotesFromMeta', () => {
	const blocks: Array< Block > = [];

	beforeEach( () => {
		vi.mocked( warning ).mockClear();
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
			[ 'an array holding null', '[null]' ],
			[ 'an array holding a string', '["text"]' ],
		] )( 'does not throw on %s', ( _label, footnotes ) => {
			expect( () =>
				updateFootnotesFromMeta( blocks, { footnotes } )
			).not.toThrow();
			expect( warning ).toHaveBeenCalled();
		} );

		it( 'keeps the footnotes around an item that is not a footnote', () => {
			// A new order makes the meta be written again.
			vi.mocked( getFootnotesOrder ).mockReturnValueOnce( [ 'b', 'a' ] );

			const { meta } = updateFootnotesFromMeta( blocks, {
				footnotes:
					'[{"id":"a","content":"A"},null,{"id":"b","content":"B"}]',
			} );

			expect( JSON.parse( meta?.footnotes as string ) ).toEqual( [
				{ id: 'b', content: 'B' },
				{ id: 'a', content: 'A' },
			] );
		} );

		it( 'treats an unreadable value as no footnotes', () => {
			expect(
				updateFootnotesFromMeta( blocks, { footnotes: 'null' } )
			).toEqual( { blocks } );
		} );
	} );
} );
