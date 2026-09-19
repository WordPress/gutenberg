import { describe, expect, it } from 'vitest';
import { escape } from '../utils';

describe( 'core/code', () => {
	describe( 'escape()', () => {
		it( 'should escape opening square brackets', () => {
			const text = escape( '[shortcode][/shortcode]' );
			expect( text ).toBe( '&#91;shortcode]&#91;/shortcode]' );
		} );

		it( 'should escape the protocol of an isolated url', () => {
			const text = escape( 'https://example.com/test/' );
			expect( text ).toBe( 'https:&#47;&#47;example.com/test/' );
		} );

		it( 'should not escape the protocol of a non isolated url', () => {
			const text = escape( 'Text https://example.com/test/' );
			expect( text ).toBe( 'Text https://example.com/test/' );
		} );

		it( 'should escape the protocol of every isolated url when there is more than one', () => {
			const text = escape(
				'https://example.com/one/\nhttps://example.com/two/'
			);
			expect( text ).toBe(
				'https:&#47;&#47;example.com/one/\nhttps:&#47;&#47;example.com/two/'
			);
		} );
	} );
} );
