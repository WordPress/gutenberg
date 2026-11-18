import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { find, isFocusable } from '../focusable';

describe( 'focusable.isFocusable()', () => {
	let container: HTMLDivElement;

	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
	} );

	afterEach( () => {
		container.remove();
	} );

	it.each( [
		[ 'button', '<button>Control</button>', true ],
		[ 'input', '<input>', true ],
		[ 'textarea', '<textarea></textarea>', true ],
		[ 'select', '<select><option>Option</option></select>', true ],
		[ 'link', '<a href="#target">Link</a>', true ],
		[ 'summary', '<details><summary>Disclosure</summary></details>', true ],
		[
			'custom control',
			'<div tabindex="0" role="checkbox">Control</div>',
			true,
		],
		[ 'negative tabindex', '<div tabindex="-1">Control</div>', true ],
		[ 'editable', '<div contenteditable="true">Text</div>', true ],
		[ 'plain element', '<div>Text</div>', false ],
		[ 'disabled button', '<button disabled>Control</button>', false ],
		[ 'disabled input', '<input disabled>', false ],
		[ 'hidden input', '<input type="hidden">', false ],
		[ 'hidden element', '<button hidden>Control</button>', false ],
		[
			'invisible element',
			'<button style="visibility:hidden">Control</button>',
			false,
		],
		[
			'inert ancestor',
			'<div inert><button>Control</button></div>',
			false,
		],
	] as const )(
		'checks a %s consistently with find()',
		( _, html, expected ) => {
			container.innerHTML = html;
			const element =
				container.querySelector(
					'summary, button, input, textarea, select, a, [tabindex], [contenteditable]'
				) ?? container.firstElementChild!;

			expect( isFocusable( element ) ).toBe( expected );
			expect( find( container ).includes( element as HTMLElement ) ).toBe(
				expected
			);
		}
	);
} );

describe( 'focusable.find() CSS visibility', () => {
	let node: HTMLDivElement;

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
			const input = node.querySelector( 'input' )!;
			const checkVisibility = vi.spyOn( input, 'checkVisibility' );

			expect( input.offsetWidth ).toBeGreaterThan( 0 );
			expect( input.offsetHeight ).toBeGreaterThan( 0 );
			expect( input.getClientRects().length ).toBeGreaterThan( 0 );
			input.focus();
			expect( input ).not.toHaveFocus();
			expect( find( node ) ).toEqual( [] );
			expect( checkVisibility ).toHaveBeenCalledWith( {
				visibilityProperty: true,
			} );
		}
	);

	it( 'includes inputs that restore visibility inside a hidden ancestor', () => {
		node.style.visibility = 'hidden';
		node.innerHTML = '<input style="visibility: visible">';
		const input = node.querySelector( 'input' )!;

		input.focus();
		expect( input ).toHaveFocus();
		expect( find( node ) ).toEqual( [ input ] );
	} );

	it( 'uses the owning window for the computed-style fallback', () => {
		const iframe = document.createElement( 'iframe' );
		node.appendChild( iframe );
		const iframeDocument = iframe.contentDocument!;
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
			iframeDocument.defaultView!,
			'getComputedStyle'
		);

		expect( find( iframeDocument.body ) ).toEqual( [ visibleInput ] );
		expect( getComputedStyle ).toHaveBeenCalledWith( hiddenInput );
		expect( getComputedStyle ).toHaveBeenCalledWith( visibleInput );
	} );
} );

const createElement = < K extends keyof HTMLElementTagNameMap >( type: K ) =>
	document.createElement( type );
const IMAGE_SOURCE =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function findFocusable( context: Element ) {
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
			node.firstChild!.appendChild( createElement( 'input' ) );

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

		it( 'finds a mapped area whose referenced image is visible', async () => {
			const node = createElement( 'div' );
			node.innerHTML = `
				<map name="testfocus">
					<area href="#target" shape="rect" coords="0,0,30,30" alt="Target">
				</map>
				<img src="${ IMAGE_SOURCE }" usemap="#testfocus" width="40" height="40" alt="">
			`;
			const area = node.querySelector( 'area' )!;
			const image = node.querySelector( 'img' )!;

			document.body.appendChild( node );
			await image.decode();

			expect( area.getClientRects() ).toHaveLength( 0 );
			expect( image.getClientRects().length ).toBeGreaterThan( 0 );
			area.focus();
			expect( area ).toHaveFocus();
			expect( find( node ) ).toEqual( [ area ] );
			expect( isFocusable( area ) ).toBe( true );
		} );

		it( 'ignores a mapped area whose referenced image is hidden', () => {
			const node = createElement( 'div' );
			node.innerHTML = `
				<map name="testfocus">
					<area href="#target" shape="rect" coords="0,0,30,30" alt="Target">
				</map>
				<img src="${ IMAGE_SOURCE }" usemap="#testfocus" width="40" height="40" alt="" style="visibility: hidden">
			`;
			const image = node.querySelector( 'img' )!;

			document.body.appendChild( node );

			expect( image.getClientRects().length ).toBeGreaterThan( 0 );
			expect( find( node ) ).toEqual( [] );
			expect( isFocusable( node.querySelector( 'area' )! ) ).toBe(
				false
			);
		} );

		it( 'ignores a mapped area whose referenced image is inside an inert subtree', () => {
			const node = createElement( 'div' );
			node.innerHTML = `
				<map name="testfocus">
					<area href="#target" shape="rect" coords="0,0,30,30" alt="Target">
				</map>
				<div inert>
					<img src="${ IMAGE_SOURCE }" usemap="#testfocus" width="40" height="40" alt="">
				</div>
			`;

			expect( findFocusable( node ) ).toEqual( [] );
		} );

		it( "finds a mapped area whose referenced image is outside the map's inert subtree", async () => {
			const node = createElement( 'div' );
			node.innerHTML = `
				<div inert>
					<map name="testfocus">
						<area href="#target" shape="rect" coords="0,0,30,30" alt="Target">
					</map>
				</div>
				<img src="${ IMAGE_SOURCE }" usemap="#testfocus" width="40" height="40" alt="">
			`;
			const area = node.querySelector( 'area' )!;
			const image = node.querySelector( 'img' )!;

			document.body.appendChild( node );
			await image.decode();

			area.focus();
			expect( area ).toHaveFocus();
			expect( find( node ) ).toEqual( [ area ] );
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
