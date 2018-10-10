/**
 * Internal dependencies
 */
import {
	getNamedNodeMapAsObject,
	toHTML,
	fromDOM,
} from '../node';

describe( 'getNamedNodeMapAsObject', () => {
	it( 'should return an object of node attributes', () => {
		const node = document.createElement( 'img' );
		node.setAttribute( 'src', 'https://s.w.org/style/images/wporg-logo.svg' );

		const object = getNamedNodeMapAsObject( node.attributes );
		expect( object ).toEqual( {
			src: 'https://s.w.org/style/images/wporg-logo.svg',
		} );
	} );
} );

describe( 'toHTML', () => {
	it( 'should convert a block node to its equivalent html string', () => {
		const blockNode = {
			type: 'strong',
			props: {
				class: 'is-extra-strong',
				children: [ 'This is a test' ],
			},
		};

		const html = toHTML( blockNode );

		expect( html ).toBe( '<strong class="is-extra-strong">This is a test</strong>' );
	} );
} );

describe( 'fromDOM', () => {
	it( 'should return a text node as its string node value', () => {
		const node = document.createTextNode( 'Hello world' );

		const blockNode = fromDOM( node );

		expect( blockNode ).toBe( 'Hello world' );
	} );

	it( 'should throw an error on receiving non-element/text node', () => {
		expect( () => {
			fromDOM( document.createDocumentFragment() );
		} ).toThrow( TypeError );
	} );

	it( 'should return an equivalent block node, including children', () => {
		const node = document.createElement( 'strong' );
		node.setAttribute( 'class', 'is-extra-strong' );
		node.innerHTML = 'Hello <em>world</em>!';

		const blockNode = fromDOM( node );

		expect( blockNode ).toEqual( {
			type: 'strong',
			props: {
				class: 'is-extra-strong',
				children: [
					'Hello ',
					{
						type: 'em',
						props: {
							children: [ 'world' ],
						},
					},
					'!',
				],
			},
		} );
	} );
} );
