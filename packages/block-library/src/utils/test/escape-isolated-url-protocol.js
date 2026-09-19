import { describe, expect, it } from 'vitest';
import { escapeIsolatedUrlProtocol } from '../escape-isolated-url-protocol';

describe( 'escapeIsolatedUrlProtocol', () => {
	it( 'escapes the protocol of a URL alone on its own line', () => {
		expect( escapeIsolatedUrlProtocol( 'https://example.com/test/' ) ).toBe(
			'https:&#47;&#47;example.com/test/'
		);
	} );

	it( 'escapes a URL alone on its own line among other lines', () => {
		expect(
			escapeIsolatedUrlProtocol(
				'Before\nhttps://example.com/test/\nAfter'
			)
		).toBe( 'Before\nhttps:&#47;&#47;example.com/test/\nAfter' );
	} );

	it( 'escapes every isolated URL when there is more than one', () => {
		expect(
			escapeIsolatedUrlProtocol(
				'https://twitter.com/wordpress/status/1\nhttps://twitter.com/wordpress/status/2\nhttps://twitter.com/wordpress/status/3'
			)
		).toBe(
			'https:&#47;&#47;twitter.com/wordpress/status/1\nhttps:&#47;&#47;twitter.com/wordpress/status/2\nhttps:&#47;&#47;twitter.com/wordpress/status/3'
		);
	} );

	it( 'does not escape a URL that has other text on the same line', () => {
		expect(
			escapeIsolatedUrlProtocol( 'Text https://example.com/test/' )
		).toBe( 'Text https://example.com/test/' );
	} );

	it( 'does not affect content with no URL', () => {
		expect( escapeIsolatedUrlProtocol( 'Just some text' ) ).toBe(
			'Just some text'
		);
	} );
} );
