/**
 * Internal dependencies
 */
import {
	isTinyMCEInternalAttribute,
	isTinyMCEBogusElement,
	isTinyMCEBogusWrapperElement,
	getCleanTextNodeValue,
	createBlockChildrenFromTinyMCEElement,
	domToBlockChildren,
	domToString,
} from '../format';

describe( 'isTinyMCEInternalAttribute', () => {
	it( 'should return false for non-internal tinymce attribute', () => {
		const result = isTinyMCEInternalAttribute( 'class' );

		expect( result ).toBe( false );
	} );

	it( 'should return true for internal tinymce attribute', () => {
		const result = isTinyMCEInternalAttribute( 'data-mce-selected' );

		expect( result ).toBe( true );
	} );
} );

describe( 'isTinyMCEBogusElement', () => {
	it( 'should return false for non-bogus element', () => {
		const element = document.createElement( 'span' );

		const result = isTinyMCEBogusElement( element );

		expect( result ).toBe( false );
	} );

	it( 'should return false for non-"bogus=all" element', () => {
		const element = document.createElement( 'span' );
		element.setAttribute( 'data-mce-bogus', '' );

		const result = isTinyMCEBogusElement( element );

		expect( result ).toBe( false );
	} );

	it( 'should return true for "bogus=all" element', () => {
		const element = document.createElement( 'span' );
		element.setAttribute( 'data-mce-bogus', 'all' );

		const result = isTinyMCEBogusElement( element );

		expect( result ).toBe( true );
	} );
} );

describe( 'isTinyMCEBogusWrapperElement', () => {
	it( 'should return false for non-bogus element', () => {
		const element = document.createElement( 'span' );

		const result = isTinyMCEBogusWrapperElement( element );

		expect( result ).toBe( false );
	} );

	it( 'should return false for "bogus=all" element', () => {
		const element = document.createElement( 'span' );
		element.setAttribute( 'data-mce-bogus', 'all' );

		const result = isTinyMCEBogusWrapperElement( element );

		expect( result ).toBe( false );
	} );

	it( 'should return true for non-"bogus=all" element', () => {
		const element = document.createElement( 'span' );
		element.setAttribute( 'data-mce-bogus', '' );

		const result = isTinyMCEBogusWrapperElement( element );

		expect( result ).toBe( true );
	} );
} );

describe( 'getCleanTextNodeValue', () => {
	it( 'returns text node value without zwsp', () => {
		const node = document.createTextNode( 'Aaaargh\uFEFF' );

		const result = getCleanTextNodeValue( node );

		expect( result ).toBe( 'Aaaargh' );
	} );
} );

describe( 'createBlockChildrenFromTinyMCEElement', () => {
	it( 'returns recusrively cleaned tinymce element as block children', () => {
		const element = document.createElement( 'div' );
		element.setAttribute( 'style', 'color: red' );
		const text = document.createTextNode( 'Aaaargh\uFEFF' );
		element.appendChild( text );
		const br = document.createElement( 'br' );
		br.setAttribute( 'data-mce-bogus', 'all' );
		element.appendChild( br );

		const result = createBlockChildrenFromTinyMCEElement( element );

		expect( result ).toEqual( {
			type: 'div',
			props: {
				style: 'color: red',
				children: [ 'Aaaargh' ],
			},
		} );
	} );
} );

describe( 'domToBlockChildren', () => {
	test( 'should return an empty array', () => {
		expect( domToBlockChildren( [] ) ).toEqual( [] );
	} );

	test( 'should return the corresponding element ', () => {
		const domElement = document.createElement( 'div' );
		domElement.innerHTML = '<div class="container"><strong>content</strong></div>';
		expect( domToBlockChildren( domElement.childNodes ) ).toMatchSnapshot();
	} );
} );

describe( 'domToString', () => {
	test( 'should return an empty string', () => {
		expect( domToString( [] ) ).toEqual( '' );
	} );

	test( 'should return the HTML', () => {
		const domElement = document.createElement( 'div' );
		const content = '<div class="container"><strong>content</strong></div>';
		domElement.innerHTML = content;
		expect( domToString( domElement.childNodes ) ).toBe( content );
	} );
} );

