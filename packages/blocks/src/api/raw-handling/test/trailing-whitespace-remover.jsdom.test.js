import { describe, expect, it } from 'vitest';
import filter from '../trailing-whitespace-remover';
import { deepFilterHTML } from '../utils';

describe( 'trailingWhitespaceRemover', () => {
	it( 'should remove a trailing line break', () => {
		expect( deepFilterHTML( '<p>a<br></p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should remove every trailing line break', () => {
		expect( deepFilterHTML( '<p>a<br><br></p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should keep a line break between lines', () => {
		expect( deepFilterHTML( '<p>a<br>b</p>', [ filter ] ) ).toEqual(
			'<p>a<br>b</p>'
		);
	} );

	it( 'should keep an empty line between lines', () => {
		expect( deepFilterHTML( '<p>a<br><br>b</p>', [ filter ] ) ).toEqual(
			'<p>a<br><br>b</p>'
		);
	} );

	it( 'should remove a non-breaking space at the end of a block', () => {
		expect( deepFilterHTML( '<p>a&nbsp;</p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should remove a run of non-breaking and regular spaces', () => {
		expect(
			deepFilterHTML( '<p>a &nbsp;&nbsp; </p>', [ filter ] )
		).toEqual( '<p>a</p>' );
	} );

	it( 'should remove a non-breaking space before a line break', () => {
		expect( deepFilterHTML( '<p>a&nbsp;<br>b</p>', [ filter ] ) ).toEqual(
			'<p>a<br>b</p>'
		);
	} );

	it( 'should remove a non-breaking space at the end of an inline element', () => {
		expect(
			deepFilterHTML( '<p><strong>a&nbsp;</strong></p>', [ filter ] )
		).toEqual( '<p><strong>a</strong></p>' );
	} );

	it( 'should remove a non-breaking space at the end of an inline element before a line break', () => {
		expect(
			deepFilterHTML( '<p><strong>a&nbsp;</strong><br>b</p>', [ filter ] )
		).toEqual( '<p><strong>a</strong><br>b</p>' );
	} );

	it( 'should remove an inline element left empty', () => {
		expect(
			deepFilterHTML( '<p>a<strong>&nbsp;</strong></p>', [ filter ] )
		).toEqual( '<p>a</p>' );
	} );

	it( 'should remove a line break left trailing by an emptied node', () => {
		expect( deepFilterHTML( '<p>a<br>&nbsp;</p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should keep a line break that still separates lines', () => {
		expect(
			deepFilterHTML( '<p>a<br>&nbsp;<br>b</p>', [ filter ] )
		).toEqual( '<p>a<br><br>b</p>' );
	} );

	it( 'should stop at content', () => {
		expect(
			deepFilterHTML( '<p>a <img src="a.png">&nbsp;</p>', [ filter ] )
		).toEqual( '<p>a <img src="a.png"></p>' );
	} );

	it( 'should keep a non-breaking space between words', () => {
		expect( deepFilterHTML( '<p>a&nbsp;b</p>', [ filter ] ) ).toEqual(
			'<p>a&nbsp;b</p>'
		);
	} );

	it( 'should keep a non-breaking space before an inline element', () => {
		expect(
			deepFilterHTML( '<p>a&nbsp;<strong>b</strong></p>', [ filter ] )
		).toEqual( '<p>a&nbsp;<strong>b</strong></p>' );
	} );

	it( 'should keep preformatted text untouched', () => {
		expect(
			deepFilterHTML( '<pre>a&nbsp;<br></pre>', [ filter ] )
		).toEqual( '<pre>a&nbsp;<br></pre>' );
	} );
} );
