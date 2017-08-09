/**
 * Internal dependencies
 */
import { isFocusable, findFocusable, findFirstFocusable } from '../focus';

describe( 'focus', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'isFocusable()', () => {
		it( 'returns false if passed falsey value', () => {
			expect( isFocusable() ).toBe( false );
		} );

		it( 'returns false if node has negative tabIndex', () => {
			const node = document.createElement( 'input' );
			node.tabIndex = -1;

			expect( isFocusable( node ) ).toBe( false );
		} );

		it( 'returns false if node is focusable input type and disabled', () => {
			const node = document.createElement( 'input' );
			node.disabled = true;

			expect( isFocusable( node ) ).toBe( false );
		} );

		it( 'returns true if node is focusable input type and not disabled', () => {
			const node = document.createElement( 'input' );

			expect( isFocusable( node ) ).toBe( true );
		} );

		it( 'returns false if anchor without href', () => {
			const node = document.createElement( 'a' );

			expect( isFocusable( node ) ).toBe( false );
		} );

		it( 'returns true if anchor with href', () => {
			const node = document.createElement( 'a' );
			node.href = 'https://wordpress.org';

			expect( isFocusable( node ) ).toBe( true );
		} );

		it( 'returns true if tabindex 0', () => {
			const node = document.createElement( 'div' );
			node.tabIndex = 0;

			expect( isFocusable( node ) ).toBe( true );
		} );

		it( 'returns true if positive tabindex', () => {
			const node = document.createElement( 'div' );
			node.tabIndex = 1;

			expect( isFocusable( node ) ).toBe( true );
		} );
	} );

	describe( 'findFocusable()', () => {
		it( 'returns undefined if falsey argument passed', () => {
			expect( findFocusable() ).toBe( undefined );
		} );

		it( 'returns undefined if no children', () => {
			const node = document.createElement( 'div' );

			expect( findFocusable( node ) ).toBe( undefined );
		} );

		it( 'returns undefined if no focusable children', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'div' ) );

			expect( findFocusable( node ) ).toBe( undefined );
		} );

		it( 'finds first focusable child', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'input' ) );

			expect( findFocusable( node ).nodeName ).toBe( 'INPUT' );
		} );

		it( 'finds nested first focusable child', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'div' ) );
			node.firstChild.appendChild( document.createElement( 'input' ) );

			expect( findFocusable( node ).nodeName ).toBe( 'INPUT' );
		} );

		it( 'does not traverse up to body', () => {
			const node = document.createElement( 'div' );
			document.body.appendChild( node );
			document.body.appendChild( document.createElement( 'input' ) );

			expect( findFocusable( node ) ).toBe( undefined );
		} );

		it( 'does not return context even if focusable', () => {
			const node = document.createElement( 'div' );
			node.tabIndex = 0;

			expect( findFocusable( node ) ).toBe( undefined );
		} );
	} );

	describe( 'findFirstFocusable()', () => {
		it( 'returns undefined if falsey node', () => {
			expect( findFirstFocusable() ).toBe( undefined );
		} );

		it( 'returns node if focusable', () => {
			const node = document.createElement( 'input' );

			expect( findFirstFocusable( node ) ).toBe( node );
		} );

		it( 'traverses into children to find focusable', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'div' ) );
			node.firstChild.appendChild( document.createElement( 'input' ) );

			expect( findFirstFocusable( node ).nodeName ).toBe( 'INPUT' );
		} );

		it( 'traverses through siblings to find focusable', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'div' ) );
			node.appendChild( document.createElement( 'input' ) );

			expect( findFirstFocusable( node ).nodeName ).toBe( 'INPUT' );
		} );

		it( 'traverses through parent siblings to find focusable', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'div' ) );
			document.body.appendChild( node );
			document.body.appendChild( document.createElement( 'input' ) );

			expect( findFirstFocusable( node ).nodeName ).toBe( 'INPUT' );
		} );

		it( 'returns undefined if nothing focusable', () => {
			expect( findFirstFocusable( document.body ) ).toBe( undefined );
		} );

		it( 'limits found focusables to specific context', () => {
			const node = document.createElement( 'div' );
			node.appendChild( document.createElement( 'div' ) );
			document.body.appendChild( node );
			document.body.appendChild( document.createElement( 'input' ) );

			expect( findFirstFocusable( node, node ) ).toBe( undefined );
		} );
	} );
} );
