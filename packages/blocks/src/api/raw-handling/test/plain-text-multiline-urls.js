/**
 * Internal dependencies
 */
import { plainTextToMultilineUrlHTML } from '../plain-text-multiline-urls';

describe( 'plainTextToMultilineUrlHTML', () => {
	it( 'returns null for a single URL', () => {
		expect(
			plainTextToMultilineUrlHTML(
				'https://github.com/WordPress/gutenberg/issues/81026'
			)
		).toBeNull();
	} );

	it( 'returns null when any line is not a standalone URL', () => {
		expect(
			plainTextToMultilineUrlHTML(
				'https://github.com/WordPress/gutenberg/issues/81026\nNot a URL'
			)
		).toBeNull();
	} );

	it( 'returns one paragraph per URL for multi-line URL-only plain text', () => {
		expect(
			plainTextToMultilineUrlHTML(
				[
					'https://github.com/WordPress/gutenberg/issues/81026',
					'https://github.com/WordPress/gutenberg/issues/81025',
					'https://github.com/WordPress/gutenberg/issues/81014',
				].join( '\n' )
			)
		).toBe(
			[
				'<p>https://github.com/WordPress/gutenberg/issues/81026</p>',
				'<p>https://github.com/WordPress/gutenberg/issues/81025</p>',
				'<p>https://github.com/WordPress/gutenberg/issues/81014</p>',
			].join( '' )
		);
	} );
} );
