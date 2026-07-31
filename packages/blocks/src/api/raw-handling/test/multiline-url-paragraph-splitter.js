/**
 * Internal dependencies
 */
import multilineUrlParagraphSplitter from '../multiline-url-paragraph-splitter';

describe( 'multilineUrlParagraphSplitter', () => {
	it( 'splits a paragraph with multiple URL links into separate paragraphs', () => {
		const HTML =
			'<p><a href="https://github.com/WordPress/gutenberg/issues/81026">https://github.com/WordPress/gutenberg/issues/81026</a><br><a href="https://github.com/WordPress/gutenberg/issues/81025">https://github.com/WordPress/gutenberg/issues/81025</a><br><a href="https://github.com/WordPress/gutenberg/issues/81014">https://github.com/WordPress/gutenberg/issues/81014</a></p>';

		expect( multilineUrlParagraphSplitter( HTML ) ).toBe(
			[
				'<p><a href="https://github.com/WordPress/gutenberg/issues/81026">https://github.com/WordPress/gutenberg/issues/81026</a></p>',
				'<p><a href="https://github.com/WordPress/gutenberg/issues/81025">https://github.com/WordPress/gutenberg/issues/81025</a></p>',
				'<p><a href="https://github.com/WordPress/gutenberg/issues/81014">https://github.com/WordPress/gutenberg/issues/81014</a></p>',
			].join( '' )
		);
	} );

	it( 'leaves mixed-content paragraphs unchanged', () => {
		const HTML =
			'<p>Read <a href="https://example.com">https://example.com</a> for details.</p>';

		expect( multilineUrlParagraphSplitter( HTML ) ).toBe( HTML );
	} );
} );
