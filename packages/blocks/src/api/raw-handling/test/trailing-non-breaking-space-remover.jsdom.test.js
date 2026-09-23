import { describe, expect, it } from 'vitest';
import filter from '../trailing-non-breaking-space-remover';
import { deepFilterHTML } from '../utils';

describe( 'trailingNonBreakingSpaceRemover', () => {
	it( 'should remove a non-breaking space at the end of a block', () => {
		expect( deepFilterHTML( '<p>a&nbsp;</p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should remove a run of non-breaking spaces', () => {
		expect(
			deepFilterHTML( '<p>a&nbsp;&nbsp;&nbsp;</p>', [ filter ] )
		).toEqual( '<p>a</p>' );
	} );

	it( 'should remove regular spaces mixed into the trailing run', () => {
		expect( deepFilterHTML( '<p>a &nbsp; </p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should remove a non-breaking space before a line break', () => {
		expect( deepFilterHTML( '<p>a&nbsp;<br>b</p>', [ filter ] ) ).toEqual(
			'<p>a<br>b</p>'
		);
	} );

	it( 'should remove a non-breaking space at the end of an inline element that ends the line', () => {
		expect(
			deepFilterHTML( '<p><strong>a&nbsp;</strong></p>', [ filter ] )
		).toEqual( '<p><strong>a</strong></p>' );
	} );

	it( 'should remove a text node that only held non-breaking spaces', () => {
		expect(
			deepFilterHTML( '<p><strong>a</strong>&nbsp;</p>', [ filter ] )
		).toEqual( '<p><strong>a</strong></p>' );
	} );

	it( 'should remove a line break left trailing by the removal', () => {
		expect( deepFilterHTML( '<p>a<br>&nbsp;</p>', [ filter ] ) ).toEqual(
			'<p>a</p>'
		);
	} );

	it( 'should keep a line break that still separates lines', () => {
		expect(
			deepFilterHTML( '<p>a<br>&nbsp;<br>b</p>', [ filter ] )
		).toEqual( '<p>a<br><br>b</p>' );
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

	it( 'should keep a trailing regular space alone', () => {
		expect( deepFilterHTML( '<p>a </p>', [ filter ] ) ).toEqual(
			'<p>a </p>'
		);
	} );

	it( 'should keep preformatted text untouched', () => {
		expect( deepFilterHTML( '<pre>a&nbsp;</pre>', [ filter ] ) ).toEqual(
			'<pre>a&nbsp;</pre>'
		);
	} );
} );
