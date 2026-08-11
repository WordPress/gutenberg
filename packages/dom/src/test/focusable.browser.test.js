import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { find } from '../focusable';

describe( 'focusable.find() CSS visibility', () => {
	let node;

	beforeEach( () => {
		node = document.createElement( 'div' );
		document.body.appendChild( node );
	} );

	afterEach( () => {
		node.remove();
	} );

	it.each( [
		[ 'visibility: hidden', '<input style="visibility: hidden">' ],
		[
			'inherited visibility: hidden',
			'<div style="visibility: hidden"><input></div>',
		],
		[ 'visibility: collapse', '<input style="visibility: collapse">' ],
		[
			'content-visibility: hidden ancestor',
			'<div style="content-visibility: hidden"><input></div>',
		],
	] )(
		'excludes inputs with %s even when they have layout boxes',
		( _, html ) => {
			node.innerHTML = html;
			const input = node.querySelector( 'input' );
			const checkVisibility = vi.spyOn( input, 'checkVisibility' );

			expect( input.offsetWidth ).toBeGreaterThan( 0 );
			expect( input.offsetHeight ).toBeGreaterThan( 0 );
			expect( input.getClientRects().length ).toBeGreaterThan( 0 );
			input.focus();
			expect( document.activeElement ).not.toBe( input );
			expect( find( node ) ).toEqual( [] );
			expect( checkVisibility ).toHaveBeenCalledWith( {
				visibilityProperty: true,
			} );
		}
	);

	it( 'includes inputs that restore visibility inside a hidden ancestor', () => {
		node.style.visibility = 'hidden';
		node.innerHTML = '<input style="visibility: visible">';
		const input = node.querySelector( 'input' );

		input.focus();
		expect( document.activeElement ).toBe( input );
		expect( find( node ) ).toEqual( [ input ] );
	} );

	it( 'uses the owning window for the computed-style fallback', () => {
		const iframe = document.createElement( 'iframe' );
		node.appendChild( iframe );
		const iframeDocument = iframe.contentDocument;
		iframeDocument.body.innerHTML = `
			<div style="visibility: hidden">
				<input>
				<input style="visibility: visible">
			</div>
		`;
		const [ hiddenInput, visibleInput ] =
			iframeDocument.querySelectorAll( 'input' );
		Object.defineProperties( hiddenInput, {
			checkVisibility: { value: undefined },
		} );
		Object.defineProperties( visibleInput, {
			checkVisibility: { value: undefined },
		} );
		const getComputedStyle = vi.spyOn(
			iframeDocument.defaultView,
			'getComputedStyle'
		);

		expect( find( iframeDocument.body ) ).toEqual( [ visibleInput ] );
		expect( getComputedStyle ).toHaveBeenCalledWith( hiddenInput );
		expect( getComputedStyle ).toHaveBeenCalledWith( visibleInput );
	} );
} );

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
			// Keep the fixture connected so JSDOM invalidates computed styles.
			document.body.appendChild( node );

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
			// Keep the fixture connected so JSDOM invalidates computed styles.
			document.body.appendChild( node );

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
