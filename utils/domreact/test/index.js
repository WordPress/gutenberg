import { createElement, renderToString } from '@wordpress/element';
import { nodeListToReact, nodeToReact } from '../index';

describe( 'nodeToReact()', () => {
	[ // Empty
		{
			description: 'should return null for null',
			value: null,
		},
		{
			description: 'should return null for non-node',
			value: 'not a node',
		},
	].forEach( ( { description, text } ) => {
		it( description, () => {
			expect( nodeToReact( text, createElement ) ).toEqual( null );
		} );
	} );

	[ // Text
		{
			description: 'should return empty string for empty text node',
			text: '',
		},
		{
			description: 'should return string for text node',
			text: 'test',
		},
	].forEach( ( { description, text } ) => {
		it( description, () => {
			expect( nodeToReact( document.createTextNode( text ), createElement ) ).toEqual( text );
		} );
	} );

	[ // Elements
		{
			description: 'should return React element for DOM element',
			HTML: '<p>test</p>',
		},
		{
			description: 'should return React element with props for DOM element with attributes',
			HTML: '<p class="test">test</p>',
		},
		{
			description: 'should return React element with children for DOM element with children',
			HTML: '<p>test <strong>test</strong></p>',
		},
		{
			description: 'should return React element with children for DOM element with children',
			HTML: '<p>test <strong>test</strong></p>',
		},
		{
			description: 'should return React element with style for DOM element with style',
			HTML: '<p style="-webkit-box-shadow:1px 1px 1px rgba(0,0,0,0.75)">test</p>',
		},
	].forEach( ( { description, HTML } ) => {
		it( description, () => {
			document.body.innerHTML = HTML;
			expect( renderToString( nodeToReact( document.body.firstChild, createElement ) ) ).toEqual( HTML );
		} );
	} );

	it( 'should return React element without filtered attribute', () => {
		document.body.innerHTML = '<p data-test="true">test</p>';
		expect( renderToString( nodeToReact( document.body.firstChild, ( type, props, ...children ) => {
			delete props[ 'data-test' ];
			return createElement( type, props, ...children );
		} ) ) ).toEqual( '<p>test</p>' );
	} );

	it( 'should return React element without filtered child', () => {
		document.body.innerHTML = '<p>test <span data-test="true">test <strong>test</strong></span></p>';
		expect( renderToString( nodeToReact( document.body.firstChild, ( type, props, ...children ) => {
			if ( ! props[ 'data-test' ] ) {
				return createElement( type, props, ...children );
			}
		} ) ) ).toEqual( '<p>test </p>' );
	} );

	it( 'should return React element without filtered tag', () => {
		document.body.innerHTML = '<p>test <span data-test="true">test <strong>test</strong></span></p>';
		expect( renderToString( nodeToReact( document.body.firstChild, ( type, props, ...children ) => {
			if ( ! props[ 'data-test' ] ) {
				return createElement( type, props, ...children );
			}
			return children;
		} ) ) ).toEqual( '<p>test test <strong>test</strong></p>' );
	} );
} );

describe( 'nodeListToReact', () => {
	const rxKey = /^_domReact\d+$/;
	function assertKey( key ) {
		expect( rxKey.test( key ) ).toEqual( true );
	}

	it( 'should return array of React element with key assigned by child index', () => {
		document.body.innerHTML = '<p>test <span>test</span></p><strong>test</strong>';
		const elements = nodeListToReact( document.body.childNodes, createElement );

		assertKey( elements[ 0 ].key );
		expect( typeof elements[ 0 ].props.children[ 0 ] ).toEqual( 'string' );
		assertKey( elements[ 0 ].props.children[ 1 ].key );
		assertKey( elements[ 1 ].key );
	} );

	it( 'should reuse assigned key for same elements reference', () => {
		document.body.innerHTML = '<ul><li>one</li><li>two</li></ul>';
		const list = document.body.firstChild;
		const before = nodeListToReact( list.childNodes, createElement );

		// Rearrange second list item before first
		list.insertBefore( list.lastChild, list.firstChild );

		const after = nodeListToReact( list.childNodes, createElement );
		expect( before.map( ( { key } ) => key ) ).toEqual( after.map( ( { key } ) => key ).reverse() );
	} );
} );
