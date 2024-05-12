/**
 * Internal dependencies
 */
import {
	escapeAmpersand,
	escapeQuotationMark,
	escapeLessThan,
	escapeAttribute,
	escapeHTML,
	isValidAttributeName,
	escapeEditableHTML,
} from '..';
import __unstableEscapeGreaterThan from '../escape-greater';

type Implementation = ( str: string ) => string;

function testUnstableEscapeGreaterThan( implementation: Implementation ) {
	it( 'should escape greater than', () => {
		const result = implementation( 'Chicken > Ribs' );
		expect( result ).toBe( 'Chicken &gt; Ribs' );
	} );
}

function testEscapeAmpersand( implementation: Implementation ) {
	it( 'should escape ampersand', () => {
		const result = implementation(
			'foo & bar &amp; &AMP; baz &#931; &#bad; &#x3A3; &#X3a3; &#xevil;'
		);

		expect( result ).toBe(
			'foo &amp; bar &amp; &AMP; baz &#931; &amp;#bad; &#x3A3; &#X3a3; &amp;#xevil;'
		);
	} );
}

function testEscapeQuotationMark( implementation: Implementation ) {
	it( 'should escape quotation mark', () => {
		const result = implementation( '"Be gone!"' );

		expect( result ).toBe( '&quot;Be gone!&quot;' );
	} );
}

function testEscapeLessThan( implementation: Implementation ) {
	it( 'should escape less than', () => {
		const result = implementation( 'Chicken < Ribs' );

		expect( result ).toBe( 'Chicken &lt; Ribs' );
	} );
}

describe( 'escapeAmpersand', () => {
	testEscapeAmpersand( escapeAmpersand );
} );

describe( 'escapeQuotationMark', () => {
	testEscapeQuotationMark( escapeQuotationMark );
} );

describe( 'escapeLessThan', () => {
	testEscapeLessThan( escapeLessThan );
} );

describe( 'escapeGreaterThan', () => {
	testUnstableEscapeGreaterThan( __unstableEscapeGreaterThan );
} );

describe( 'escapeAttribute', () => {
	testEscapeAmpersand( escapeAttribute );
	testEscapeQuotationMark( escapeAttribute );
	testUnstableEscapeGreaterThan( escapeAttribute );
} );

describe( 'escapeHTML', () => {
	testEscapeAmpersand( escapeHTML );
	testEscapeLessThan( escapeHTML );
} );

describe( 'isValidAttributeName', () => {
	it( 'should return false for attribute with controls', () => {
		const result = isValidAttributeName( 'bad\u007F' );

		expect( result ).toBe( false );
	} );

	it( 'should return false for attribute with non-permitted characters', () => {
		const result = isValidAttributeName( 'bad"' );

		expect( result ).toBe( false );
	} );

	it( 'should return false for attribute with noncharacters', () => {
		const result = isValidAttributeName( 'bad\uFDD0' );

		expect( result ).toBe( false );
	} );

	it( 'should return true for valid attribute name', () => {
		const result = isValidAttributeName( 'good' );

		expect( result ).toBe( true );
	} );
} );

describe( 'escapeEditableHTML', () => {
	it( 'should escape < and all ampersands', () => {
		const result = escapeEditableHTML(
			'<a href="https://w.org">WP</a> & &lt;strong&gt;'
		);

		expect( result ).toBe(
			'&lt;a href="https://w.org">WP&lt;/a> &amp; &amp;lt;strong&amp;gt;'
		);
	} );
} );
