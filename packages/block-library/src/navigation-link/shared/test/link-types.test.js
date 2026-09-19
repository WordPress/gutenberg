import { describe, expect, it } from 'vitest';
import { getLinkKind, toApiType, toBlockType } from '../link-types';

describe( 'link types', () => {
	describe( 'toBlockType', () => {
		it.each( [
			[ 'post_tag', 'tag' ],
			[ 'post-format', 'post_format' ],
			[ 'event-series', 'event-series' ],
			[ 'my-custom-type', 'my-custom-type' ],
			[ 'page', 'page' ],
		] )( 'stores the %s API type as %s', ( apiType, blockType ) => {
			expect( toBlockType( apiType ) ).toBe( blockType );
		} );
	} );

	describe( 'toApiType', () => {
		it.each( [
			[ 'tag', 'post_tag' ],
			// The taxonomy is post_format; only the search API spells it
			// post-format.
			[ 'post_format', 'post_format' ],
			[ 'event-series', 'event-series' ],
			[ 'category', 'category' ],
		] )( 'looks up the %s block type as %s', ( blockType, apiType ) => {
			expect( toApiType( blockType ) ).toBe( apiType );
		} );
	} );

	describe( 'getLinkKind', () => {
		it.each( [
			[ 'post', 'post-type' ],
			[ 'page', 'post-type' ],
			[ 'category', 'taxonomy' ],
			[ 'tag', 'taxonomy' ],
			[ 'post_format', 'taxonomy' ],
		] )(
			'infers the kind of a %s link saved without one',
			( type, kind ) => {
				expect( getLinkKind( { type } ) ).toBe( kind );
			}
		);

		it( 'leaves a custom type without a kind undecided', () => {
			expect( getLinkKind( { type: 'event-series' } ) ).toBeUndefined();
		} );

		it( 'keeps a saved kind over the inferred one', () => {
			expect( getLinkKind( { type: 'category', kind: 'custom' } ) ).toBe(
				'custom'
			);
		} );
	} );
} );
