/**
 * Internal dependencies
 */
import commentRemover from '../comment-remover';
import { deepFilterHTML } from '../utils';

describe( 'commentRemover', () => {
	it( 'should remove a single comment', () => {
		expect( deepFilterHTML(
			'<!-- Comment -->',
			[ commentRemover ]
		) ).toEqual(
			''
		);
	} );
	it( 'should remove multiple comments', () => {
		expect( deepFilterHTML(
			'<!-- First comment --><p>First paragraph.</p><!-- Second comment --><p>Second paragraph.</p><!-- Third comment -->',
			[ commentRemover ]
		) ).toEqual(
			'<p>First paragraph.</p><p>Second paragraph.</p>'
		);
	} );
	it( 'should remove nested comments', () => {
		expect( deepFilterHTML(
			'<p>Paragraph.<!-- Comment --></p>',
			[ commentRemover ]
		) ).toEqual(
			'<p>Paragraph.</p>'
		);
	} );
	it( 'should remove multi-line comments', () => {
		expect( deepFilterHTML(
			`<p>First paragraph.</p><!--
			Multi-line
			comment
			--><p>Second paragraph.</p>`,
			[ commentRemover ]
		) ).toEqual(
			'<p>First paragraph.</p><p>Second paragraph.</p>'
		);
	} );
} );
