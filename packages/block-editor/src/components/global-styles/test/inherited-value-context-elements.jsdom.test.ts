import { describe, expect, it } from 'vitest';
import { getBlockTypesForElement } from '../inherited-value-context';

describe( 'getBlockTypesForElement', () => {
	it.each( [ 'heading', 'h2' ] )(
		'returns the heading family for %s',
		( element ) => {
			const blockTypes = getBlockTypesForElement( element );
			expect( blockTypes ).toContain( 'core/post-title' );
			expect( blockTypes ).not.toContain( 'core/paragraph' );
		}
	);

	it( 'returns only whole-link blocks for the link element', () => {
		const blockTypes = getBlockTypesForElement( 'link' );
		expect( blockTypes ).toContain( 'core/read-more' );
		expect( blockTypes ).not.toContain( 'core/post-author-name' );
	} );

	it.each( [ 'caption', 'h7', 'constructor' ] )(
		'returns an empty array for %s',
		( element ) => {
			expect( getBlockTypesForElement( element ) ).toEqual( [] );
		}
	);
} );
