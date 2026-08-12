import { beforeEach, describe, expect, it } from 'vitest';
import { find } from '../focusable';

const createElement = ( type ) => document.createElement( type );

function findFocusable( context ) {
	if ( ! context.isConnected ) {
		document.body.appendChild( context );
	}
	return find( context );
}

describe( 'focusable', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'find()', () => {
		it( 'returns empty array if no children', () => {
			const node = createElement( 'div' );

			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( 'returns empty array if no focusable children', () => {
			const node = createElement( 'div' );
			node.appendChild( createElement( 'div' ) );

			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( 'returns array of focusable children', () => {
			const node = createElement( 'div' );
			node.appendChild( createElement( 'input' ) );

			const focusable = findFocusable( node );

			expect( focusable ).toHaveLength( 1 );
			expect( focusable[ 0 ].nodeName ).toBe( 'INPUT' );
		} );

		it( 'finds nested focusable child', () => {
			const node = createElement( 'div' );
			node.appendChild( createElement( 'div' ) );
			node.firstChild.appendChild( createElement( 'input' ) );

			const focusable = findFocusable( node );

			expect( focusable ).toHaveLength( 1 );
			expect( focusable[ 0 ].nodeName ).toBe( 'INPUT' );
		} );

		it( 'finds link with no href but tabindex', () => {
			const node = createElement( 'div' );
			const link = createElement( 'a' );
			link.tabIndex = 0;
			node.appendChild( link );

			expect( findFocusable( node ) ).toEqual( [ link ] );
		} );

		it( 'finds valid area focusable', () => {
			const map = createElement( 'map' );
			map.name = 'testfocus';
			const area = createElement( 'area' );
			area.href = '';
			map.appendChild( area );
			const img = createElement( 'img' );
			img.setAttribute( 'usemap', '#testfocus' );
			img.style.width = '10px';
			img.style.height = '10px';
			document.body.appendChild( map );
			document.body.appendChild( img );

			const focusable = findFocusable( map );

			expect( focusable ).toHaveLength( 1 );
			expect( focusable[ 0 ].nodeName ).toBe( 'AREA' );
		} );

		it( 'ignores invalid area focusable', () => {
			const map = createElement( 'map' );
			map.name = 'testfocus';
			const area = createElement( 'area' );
			area.href = '';
			map.appendChild( area );
			const img = createElement( 'img' );
			img.setAttribute( 'usemap', '#testfocus' );
			img.style.width = '10px';
			img.style.height = '10px';
			img.style.display = 'none';
			document.body.appendChild( map );
			document.body.appendChild( img );

			expect( findFocusable( map ) ).toEqual( [] );
		} );

		it( 'finds contenteditable', () => {
			const node = createElement( 'div' );
			const div = createElement( 'div' );
			node.appendChild( div );

			div.setAttribute( 'contenteditable', '' );
			expect( findFocusable( node ) ).toEqual( [ div ] );

			div.setAttribute( 'contenteditable', 'true' );
			expect( findFocusable( node ) ).toEqual( [ div ] );
		} );

		it( 'ignores contenteditable=false', () => {
			const node = createElement( 'div' );
			const div = createElement( 'div' );
			node.appendChild( div );

			div.setAttribute( 'contenteditable', 'false' );
			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( 'ignores invisible inputs', () => {
			const node = createElement( 'div' );
			const input = createElement( 'input' );
			node.appendChild( input );

			input.style.visibility = 'hidden';
			expect( findFocusable( node ) ).toEqual( [] );

			input.style.visibility = 'visible';
			input.style.display = 'none';
			expect( findFocusable( node ) ).toEqual( [] );

			input.style.display = 'inline-block';
			const focusable = findFocusable( node );
			expect( focusable ).toHaveLength( 1 );
			expect( focusable[ 0 ].nodeName ).toBe( 'INPUT' );
		} );

		it( 'ignores inputs in invisible ancestors', () => {
			const node = createElement( 'div' );
			const input = createElement( 'input' );
			node.appendChild( input );

			node.style.visibility = 'hidden';
			expect( findFocusable( node ) ).toEqual( [] );

			node.style.visibility = 'visible';
			node.style.display = 'none';
			expect( findFocusable( node ) ).toEqual( [] );

			node.style.display = 'block';
			const focusable = findFocusable( node );
			expect( focusable ).toHaveLength( 1 );
			expect( focusable[ 0 ].nodeName ).toBe( 'INPUT' );
		} );

		it( 'does not return context even if focusable', () => {
			const node = createElement( 'div' );
			node.tabIndex = 0;

			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( 'limits found focusables to specific context', () => {
			const node = createElement( 'div' );
			node.appendChild( createElement( 'div' ) );
			document.body.appendChild( node );
			document.body.appendChild( createElement( 'input' ) );

			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( 'ignores elements inside inert containers', () => {
			const node = createElement( 'div' );
			const inertDiv = createElement( 'div' );
			inertDiv.setAttribute( 'inert', '' );
			const input = createElement( 'input' );
			inertDiv.appendChild( input );
			node.appendChild( inertDiv );

			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( 'returns focusable elements outside inert containers', () => {
			const node = createElement( 'div' );

			// Inert container with input
			const inertDiv = createElement( 'div' );
			inertDiv.setAttribute( 'inert', '' );
			const inertInput = createElement( 'input' );
			inertDiv.appendChild( inertInput );
			node.appendChild( inertDiv );

			// Non-inert input
			const visibleInput = createElement( 'input' );
			node.appendChild( visibleInput );

			const focusable = findFocusable( node );
			expect( focusable ).toHaveLength( 1 );
			expect( focusable[ 0 ] ).toBe( visibleInput );
		} );
	} );
} );
