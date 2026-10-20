import { describe, expect, it } from 'vitest';
import { getBlockTypesForElement } from '../inherited-value-context';

const HEADING_FAMILY = [
	'core/accordion-heading',
	'core/heading',
	'core/post-title',
	'core/site-title',
	'core/query-title',
	'core/comments-title',
	'core/term-name',
	'core/site-tagline',
];

describe( 'getBlockTypesForElement', () => {
	it( 'returns Button for the button element', () => {
		expect( getBlockTypesForElement( 'button' ) ).toEqual( [
			'core/button',
		] );
	} );

	it( 'returns the heading family for the heading element', () => {
		expect( getBlockTypesForElement( 'heading' ) ).toEqual(
			HEADING_FAMILY
		);
	} );

	it( 'returns the heading family for a heading level', () => {
		expect( getBlockTypesForElement( 'h2' ) ).toEqual( HEADING_FAMILY );
	} );

	it( 'returns only whole-link blocks for the link element', () => {
		const blockTypes = getBlockTypesForElement( 'link' );
		expect( blockTypes ).toHaveLength( 12 );
		expect( blockTypes ).toContain( 'core/read-more' );
		expect( blockTypes ).toContain( 'core/query-pagination-next' );
		expect( blockTypes ).not.toContain( 'core/paragraph' );
		expect( blockTypes ).not.toContain( 'core/post-author-name' );
	} );

	it( 'returns an empty array for an element no block renders as', () => {
		expect( getBlockTypesForElement( 'caption' ) ).toEqual( [] );
		expect( getBlockTypesForElement( 'h7' ) ).toEqual( [] );
		expect( getBlockTypesForElement( 'constructor' ) ).toEqual( [] );
	} );
} );
