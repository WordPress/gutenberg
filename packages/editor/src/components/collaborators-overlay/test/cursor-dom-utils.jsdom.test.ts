import {
	getCursorPosition,
	getNearestVisibleBlockAncestor,
	getSelectionRects,
} from '../cursor-dom-utils';

const OVERLAY_RECT = {
	left: 0,
	top: 0,
	right: 0,
	bottom: 0,
	width: 0,
	height: 0,
	x: 0,
	y: 0,
} as DOMRect;

function mockRect( element: HTMLElement, rect: Partial< DOMRect > ) {
	element.getBoundingClientRect = jest.fn().mockReturnValue( {
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		...rect,
	} );
}

// jsdom performs no layout and doesn't implement Range.getBoundingClientRect
// / getClientRects at all (not even as a zero-returning stub), so any test
// that lets getOffsetPositionInBlock create and measure a real Range needs
// this polyfilled.
beforeAll( () => {
	Range.prototype.getBoundingClientRect = jest.fn().mockReturnValue( {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
		x: 0,
		y: 0,
	} );
	Range.prototype.getClientRects = jest.fn().mockReturnValue( [] );
} );

describe( 'cursor-dom-utils', () => {
	// A closed <details>/collapsed core/accordion panel produces a target
	// element with a zero-size bounding rect (no layout box), exactly like
	// this mock. Both functions must suppress the result rather than draw a
	// cursor/selection at a fallback position derived from that zero rect.
	describe( 'hidden target element (zero-size bounding rect)', () => {
		it( 'getCursorPosition returns null instead of a fallback position', () => {
			const blockElement = document.createElement( 'p' );
			blockElement.textContent = 'hidden text';
			mockRect( blockElement, { width: 0, height: 0 } );

			const result = getCursorPosition(
				0,
				blockElement,
				document,
				OVERLAY_RECT
			);

			expect( result ).toBeNull();
		} );

		it( 'getSelectionRects returns null instead of an empty/misplaced selection', () => {
			const blockElement = document.createElement( 'p' );
			blockElement.textContent = 'hidden text';
			mockRect( blockElement, { width: 0, height: 0 } );

			const result = getSelectionRects(
				blockElement,
				0,
				5,
				document,
				OVERLAY_RECT
			);

			expect( result ).toBeNull();
		} );
	} );

	describe( 'visible target element', () => {
		it( 'getCursorPosition still returns a position for a visible block', () => {
			const blockElement = document.createElement( 'p' );
			blockElement.textContent = 'visible text';
			mockRect( blockElement, {
				left: 10,
				top: 20,
				width: 100,
				height: 20,
			} );

			const result = getCursorPosition(
				0,
				blockElement,
				document,
				OVERLAY_RECT
			);

			// jsdom performs no layout, so Range.getBoundingClientRect() is
			// always zero regardless of visibility — this falls through to
			// the pre-existing empty-block fallback, which derives coords
			// from the (visible, non-zero) blockElement rect.
			expect( result ).not.toBeNull();
			expect( result ).toEqual( { x: 10, y: 20, height: 20 } );
		} );
	} );

	describe( 'getNearestVisibleBlockAncestor', () => {
		// Build: visible outer [data-block] > hidden inner [data-block] > el.
		// Mirrors a closed core/details block containing a paragraph.
		function buildNestedBlocks( {
			outerVisible,
			innerVisible,
		}: {
			outerVisible: boolean;
			innerVisible: boolean;
		} ) {
			const outer = document.createElement( 'div' );
			outer.setAttribute( 'data-block', 'outer-clientid' );
			mockRect(
				outer,
				outerVisible
					? { width: 100, height: 20 }
					: { width: 0, height: 0 }
			);

			const inner = document.createElement( 'div' );
			inner.setAttribute( 'data-block', 'inner-clientid' );
			mockRect(
				inner,
				innerVisible
					? { width: 100, height: 20 }
					: { width: 0, height: 0 }
			);

			const el = document.createElement( 'p' );
			inner.appendChild( el );
			outer.appendChild( inner );

			return { outer, inner, el };
		}

		it( 'returns the element itself when its own block is already visible', () => {
			const { inner, el } = buildNestedBlocks( {
				outerVisible: true,
				innerVisible: true,
			} );

			expect( getNearestVisibleBlockAncestor( el ) ).toBe( inner );
		} );

		it( 'walks up past a hidden block to the nearest visible ancestor', () => {
			const { outer, el } = buildNestedBlocks( {
				outerVisible: true,
				innerVisible: false,
			} );

			expect( getNearestVisibleBlockAncestor( el ) ).toBe( outer );
		} );

		it( 'returns null when no ancestor is visible', () => {
			const { el } = buildNestedBlocks( {
				outerVisible: false,
				innerVisible: false,
			} );

			expect( getNearestVisibleBlockAncestor( el ) ).toBeNull();
		} );

		it( 'returns null when the element has no [data-block] ancestor at all', () => {
			const el = document.createElement( 'p' );

			expect( getNearestVisibleBlockAncestor( el ) ).toBeNull();
		} );
	} );
} );
