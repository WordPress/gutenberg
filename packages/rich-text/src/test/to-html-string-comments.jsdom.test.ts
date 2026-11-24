import { describe, expect, it } from 'vitest';
import '../store';
import { create } from '../create';
import { toHTMLString } from '../to-html-string';

function createElementWithComment( comment: string ) {
	const element = document.createElement( 'div' );
	element.append( 'before ', document.createComment( comment ), 'after' );
	return element;
}

describe( 'toHTMLString comments', () => {
	it.each( [
		'><em data-breakout="yes">outside</em>',
		'-><em data-breakout="yes">outside</em>',
		'--><em data-breakout="yes">outside</em>',
		'--!><em data-breakout="yes">outside</em>',
		'comment --><em data-breakout="yes">outside</em>',
		'comment --!><em data-breakout="yes">outside</em>',
	] )( 'omits the entire prematurely terminated comment: %s', ( comment ) => {
		const input = createElementWithComment( comment );
		const inputComment = input.childNodes[ 1 ];
		expect( inputComment.nodeType ).toBe( Node.COMMENT_NODE );
		expect( inputComment.nodeValue ).toBe( comment );

		const value = create( { element: input } );
		const originalValue = structuredClone( value );
		const html = toHTMLString( { value } );
		const output = document.createElement( 'div' );
		output.innerHTML = html;

		expect(
			document
				.createTreeWalker( output, NodeFilter.SHOW_COMMENT )
				.nextNode()
		).toBeNull();
		expect( output.querySelector( '[data-breakout]' ) ).toBeNull();
		expect( output ).toHaveTextContent( /^before after$/ );
		expect( html ).toBe( 'before after' );
		expect( value ).toEqual( originalValue );
		expect( inputComment.nodeValue ).toBe( comment );
	} );

	it.each( [
		'',
		'ordinary comment',
		'contains & <em>markup</em>',
		'contains -- dashes',
		'-',
		'ends with -',
		'<!',
		'ends with <!',
		' wp:paragraph {"foo":"bar"} ',
	] )( 'preserves comment data and adjacent text: %s', ( comment ) => {
		const input = createElementWithComment( comment );
		const inputComment = input.childNodes[ 1 ];
		expect( inputComment.nodeType ).toBe( Node.COMMENT_NODE );
		expect( inputComment.nodeValue ).toBe( comment );

		const value = create( { element: input } );
		const originalValue = structuredClone( value );
		const html = toHTMLString( { value } );
		const output = document.createElement( 'div' );
		output.innerHTML = html;

		expect( html ).toBe( `before <!--${ comment }-->after` );
		expect( output.childNodes ).toHaveLength( 3 );
		expect( output.childNodes[ 1 ].nodeType ).toBe( Node.COMMENT_NODE );
		expect( output.childNodes[ 1 ].nodeValue ).toBe( comment );
		expect( output.firstChild?.textContent ).toBe( 'before ' );
		expect( output.lastChild?.textContent ).toBe( 'after' );
		expect( create( { element: output } ) ).toEqual( value );
		expect( value ).toEqual( originalValue );
		expect( inputComment.nodeValue ).toBe( comment );
	} );
} );
