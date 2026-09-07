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
	] )(
		'excludes inputs with %s even when they have layout boxes',
		( _, html ) => {
			node.innerHTML = html;
			const input = node.querySelector( 'input' );

			expect( input.offsetWidth ).toBeGreaterThan( 0 );
			expect( input.offsetHeight ).toBeGreaterThan( 0 );
			expect( input.getClientRects().length ).toBeGreaterThan( 0 );
			input.focus();
			expect( document.activeElement ).not.toBe( input );
			expect( find( node ) ).toEqual( [] );
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

	it( "checks visibility in the element's owning window", () => {
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
		const getComputedStyle = vi.spyOn(
			iframeDocument.defaultView,
			'getComputedStyle'
		);

		expect( find( iframeDocument.body ) ).toEqual( [ visibleInput ] );
		expect( getComputedStyle ).toHaveBeenCalledWith( hiddenInput );
		expect( getComputedStyle ).toHaveBeenCalledWith( visibleInput );
	} );
} );
