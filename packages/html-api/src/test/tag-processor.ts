import { describe, expect, it } from 'vitest';
import { TagProcessor } from '..';

function getTokens( html: string ) {
	const processor = new TagProcessor( html );
	const tokens = [];
	while ( processor.nextToken() ) {
		tokens.push( [
			processor.getTokenName(),
			processor.isTagCloser(),
			processor.getModifiableText(),
		] );
	}
	return tokens;
}

describe( 'TagProcessor', () => {
	it( 'reads the contents of SCRIPT as text, not tags', () => {
		expect( getTokens( '<script>if(a<b){}</script><p>x</p>' ) ).toEqual( [
			[ 'SCRIPT', false, 'if(a<b){}' ],
			[ 'P', false, '' ],
			[ '#text', false, 'x' ],
			[ 'P', true, '' ],
		] );
	} );

	it( 'reads comments, including those ended abruptly', () => {
		expect( getTokens( '<!--more--><!-->x' ) ).toEqual( [
			[ '#comment', false, 'more' ],
			[ '#comment', false, '' ],
			[ '#text', false, 'x' ],
		] );
	} );

	it( 'decodes attribute values', () => {
		const processor = new TagProcessor(
			`<a href="?a=1&amp;b=2" title='"q"' hidden data-x=&copy>`
		);
		processor.nextTag();
		expect( processor.getAttribute( 'href' ) ).toBe( '?a=1&b=2' );
		expect( processor.getAttribute( 'TITLE' ) ).toBe( '"q"' );
		expect( processor.getAttribute( 'hidden' ) ).toBe( true );
		expect( processor.getAttribute( 'data-x' ) ).toBe( '©' );
		expect( processor.getAttribute( 'missing' ) ).toBe( null );
	} );

	it( 'changes only what it is asked to change', () => {
		const processor = new TagProcessor(
			`<p  CLASS='a  b' style="color:red;margin:0" data-x>Hello <b>world</b></p>`
		);
		processor.nextTag();
		processor.addClass( 'c' );
		processor.removeClass( 'a' );
		processor.setAttribute( 'title', 'x & "y"' );
		processor.removeAttribute( 'data-x' );
		expect( processor.getUpdatedHtml() ).toBe(
			`<p title="x &amp; &quot;y&quot;"  class="b c" style="color:red;margin:0" >Hello <b>world</b></p>`
		);
	} );

	it( 'returns the HTML unchanged when nothing changed', () => {
		const html = `<P CLASS=a>x<br/>y</P><!---->`;
		const processor = new TagProcessor( html );
		while ( processor.nextToken() ) {}
		expect( processor.getUpdatedHtml() ).toBe( html );
	} );

	it( 'pauses at incomplete input', () => {
		const processor = new TagProcessor( '<p>x</p><div class="' );
		while ( processor.nextToken() ) {}
		expect( processor.pausedAtIncompleteToken() ).toBe( true );
	} );
} );
