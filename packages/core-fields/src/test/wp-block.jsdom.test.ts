import { describe, expect, it } from 'vitest';
import wpBlock from '../wp_block';

describe( 'wp_block', () => {
	it( 'provides the JavaScript parts of its fields', () => {
		expect( Object.keys( wpBlock ) ).toEqual( [
			'excerpt',
			'sync-status',
			'title',
		] );
	} );

	it( 'reads the pattern description', () => {
		expect(
			wpBlock.excerpt.getValue?.( {
				item: { excerpt: { raw: 'A &amp; B' } },
			} )
		).toBe( 'A & B' );
	} );

	it( 'reads the pattern title', () => {
		expect(
			wpBlock.title.getValue?.( {
				item: { title: { raw: 'Pattern' } },
			} )
		).toBe( 'Pattern' );
	} );
} );
