import { describe, expect, it } from 'vitest';
import '../store';
import { create } from '../create';
import { toHTMLString } from '../to-html-string';

function createValueWithComment( comment: string ) {
	const element = document.createElement( 'div' );
	element.append( 'before ', document.createComment( comment ), 'after' );
	return create( { element } );
}

describe( 'toHTMLString comments', () => {
	it.each( [
		'><em data-breakout="yes">outside</em>',
		'-><em data-breakout="yes">outside</em>',
		'--><em data-breakout="yes">outside</em>',
		'--!><em data-breakout="yes">outside</em>',
		'comment --><em data-breakout="yes">outside</em>',
		'comment --!><em data-breakout="yes">outside</em>',
	] )( 'omits comment data that terminates the comment: %s', ( comment ) => {
		const value = createValueWithComment( comment );
		const originalValue = structuredClone( value );
		const html = toHTMLString( { value } );
		const element = document.createElement( 'div' );
		element.innerHTML = html;

		expect( element.querySelector( '[data-breakout]' ) ).toBeNull();
		expect( element ).toHaveTextContent( /^before after$/ );
		expect( html ).toBe( 'before after' );
		expect( value ).toEqual( originalValue );
		expect( value.replacements[ 7 ]?.attributes ).toEqual( {
			'data-rich-text-comment': comment,
		} );
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
		const value = createValueWithComment( comment );
		const html = toHTMLString( { value } );
		const element = document.createElement( 'div' );
		element.innerHTML = html;

		expect( html ).toBe( `before <!--${ comment }-->after` );
		expect( element.childNodes ).toHaveLength( 3 );
		expect( element.childNodes[ 1 ].nodeType ).toBe( Node.COMMENT_NODE );
		expect( element.childNodes[ 1 ].nodeValue ).toBe( comment );
		expect( element.firstChild?.textContent ).toBe( 'before ' );
		expect( element.lastChild?.textContent ).toBe( 'after' );
		expect( create( { element } ) ).toEqual( value );
	} );
} );
