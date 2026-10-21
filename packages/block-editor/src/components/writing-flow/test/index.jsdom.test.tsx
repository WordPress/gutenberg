import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { getClosestTabbable, isNavigationCandidate } from '../use-arrow-nav';

/**
 * Lays out a focusable element at the given viewport rectangle. jsdom does
 * not lay out, so the rectangle is what `focus.focusable` (visibility) and
 * `getClosestTabbable` (position) read.
 *
 * @param element     The element.
 * @param rect        Its rectangle.
 * @param rect.top    Top edge.
 * @param rect.left   Left edge.
 * @param rect.width  Width.
 * @param rect.height Height.
 */
function layOut(
	element: HTMLElement,
	rect: { top: number; left: number; width: number; height: number }
) {
	const domRect = {
		...rect,
		right: rect.left + rect.width,
		bottom: rect.top + rect.height,
		x: rect.left,
		y: rect.top,
		toJSON: () => domRect,
	} as DOMRect;
	element.getBoundingClientRect = () => domRect;
	element.getClientRects = () => [ domRect ] as unknown as DOMRectList;
}

describe( 'getClosestTabbable', () => {
	let container: HTMLElement;
	let label: HTMLElement;
	let input: HTMLElement;
	let button: HTMLElement;
	let next: HTMLElement;

	beforeAll( () => {
		// A full-width text field above a row with a text input on the left
		// and a button on the right, followed by a full-width text field:
		// the layout of a Search block followed by a paragraph.
		container = document.createElement( 'div' );
		label = document.createElement( 'p' );
		label.contentEditable = 'true';
		label.tabIndex = 0;
		layOut( label, { top: 0, left: 0, width: 600, height: 20 } );
		input = document.createElement( 'input' );
		input.setAttribute( 'type', 'search' );
		layOut( input, { top: 30, left: 0, width: 400, height: 20 } );
		button = document.createElement( 'p' );
		button.contentEditable = 'true';
		button.tabIndex = 0;
		layOut( button, { top: 30, left: 400, width: 200, height: 20 } );
		next = document.createElement( 'p' );
		next.contentEditable = 'true';
		next.tabIndex = 0;
		layOut( next, { top: 60, left: 0, width: 600, height: 20 } );
		container.append( label, input, button, next );
		document.body.appendChild( container );
	} );

	afterAll( () => {
		container.remove();
	} );

	it( 'should move to the field in the row under the caret in both directions', () => {
		// The caret above the input.
		expect( getClosestTabbable( label, false, container, true, 100 ) ).toBe(
			input
		);
		expect( getClosestTabbable( next, true, container, true, 100 ) ).toBe(
			input
		);

		// The caret above the button.
		expect( getClosestTabbable( label, false, container, true, 500 ) ).toBe(
			button
		);
		expect( getClosestTabbable( next, true, container, true, 500 ) ).toBe(
			button
		);
	} );

	it( 'should skip fields next to the target', () => {
		expect( getClosestTabbable( input, false, container, true, 100 ) ).toBe(
			next
		);
		expect( getClosestTabbable( button, true, container, true, 500 ) ).toBe(
			label
		);
	} );

	it( 'should fall back to DOM order without a caret position', () => {
		expect( getClosestTabbable( label, false, container, true ) ).toBe(
			input
		);
		expect( getClosestTabbable( next, true, container, true ) ).toBe(
			button
		);
	} );
} );

describe( 'isNavigationCandidate', () => {
	let elements: Record< string, HTMLElement >;
	beforeAll( () => {
		elements = {};

		elements.inputText = document.createElement( 'input' );
		elements.inputText.setAttribute( 'type', 'text' );

		elements.inputCheckbox = document.createElement( 'input' );
		elements.inputCheckbox.setAttribute( 'type', 'checkbox' );

		elements.inputNumber = document.createElement( 'input' );
		elements.inputNumber.setAttribute( 'type', 'number' );

		elements.contentEditable = document.createElement( 'p' );
		// The DOM stringifies the boolean.
		elements.contentEditable.contentEditable = true as unknown as string;
	} );

	it( 'should return true if vertically navigating input without modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );

	it( 'should return false if vertically navigating input with modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				true
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return false if vertically navigating inputs with vertical support like number', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputNumber,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return false if horizontally navigating input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return true if horizontally navigating simple inputs like checkboxes', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputCheckbox,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );

	it( 'should return true if horizontally navigating non-input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.contentEditable,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );
} );
