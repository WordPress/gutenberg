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

/**
 * Creates a block wrapper element as rendered in the canvas.
 *
 * @param clientId The block's client ID.
 * @param tagName  The wrapper's tag name.
 *
 * @return The wrapper.
 */
function createBlock( clientId: string, tagName: string = 'div' ) {
	const block = document.createElement( tagName );
	block.id = `block-${ clientId }`;
	block.className = 'block-editor-block-list__block';
	block.setAttribute( 'data-block', clientId );
	return block;
}

/**
 * Creates a focusable text field.
 *
 * @param rect Its rectangle.
 *
 * @return The field.
 */
function createField( rect: Parameters< typeof layOut >[ 1 ] ) {
	const field = document.createElement( 'p' );
	field.contentEditable = 'true';
	field.tabIndex = 0;
	layOut( field, rect );
	return field;
}

/**
 * Creates a full-width paragraph block: a text field that is its own block
 * wrapper.
 *
 * @param clientId The block's client ID.
 * @param top      Its top edge.
 *
 * @return The paragraph.
 */
function createParagraph( clientId: string, top: number ) {
	const paragraph = createField( { top, left: 0, width: 600, height: 20 } );
	paragraph.id = `block-${ clientId }`;
	paragraph.classList.add( 'block-editor-block-list__block' );
	paragraph.setAttribute( 'data-block', clientId );
	return paragraph;
}

describe( 'getClosestTabbable', () => {
	let container: HTMLElement;
	let label: HTMLElement;
	let input: HTMLElement;
	let button: HTMLElement;
	let next: HTMLElement;
	let one: HTMLElement;
	let two: HTMLElement;
	let middle: HTMLElement;
	let left: HTMLElement;
	let right: HTMLElement;
	let last: HTMLElement;

	beforeAll( () => {
		container = document.createElement( 'div' );

		// A block with a full-width text field above a row with a text
		// input on the left and a text field on the right: the layout of a
		// Search block.
		const search = createBlock( 'search' );
		label = createField( { top: 0, left: 0, width: 600, height: 20 } );
		input = document.createElement( 'input' );
		input.setAttribute( 'type', 'search' );
		layOut( input, { top: 30, left: 0, width: 400, height: 20 } );
		button = createField( { top: 30, left: 400, width: 200, height: 20 } );
		search.append( label, input, button );

		next = createParagraph( 'next', 60 );

		// A block with two text fields and an appender in a row.
		const buttons = createBlock( 'buttons' );
		one = createField( { top: 90, left: 0, width: 300, height: 20 } );
		two = createField( { top: 90, left: 300, width: 260, height: 20 } );
		const appender = document.createElement( 'div' );
		appender.className = 'block-list-appender';
		const appenderButton = document.createElement( 'button' );
		layOut( appenderButton, {
			top: 90,
			left: 560,
			width: 40,
			height: 20,
		} );
		appender.append( appenderButton );
		buttons.append( one, two, appender );

		middle = createParagraph( 'middle', 120 );

		// Two blocks side by side (as in columns), each a text field.
		const row = createBlock( 'row' );
		left = createField( { top: 150, left: 0, width: 300, height: 20 } );
		const leftBlock = createBlock( 'left' );
		leftBlock.append( left );
		right = createField( { top: 150, left: 300, width: 300, height: 20 } );
		const rightBlock = createBlock( 'right' );
		rightBlock.append( right );
		row.append( leftBlock, rightBlock );

		last = createParagraph( 'last', 180 );

		container.append( search, next, buttons, middle, row, last );
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

	it( 'should not move to an appender in the row', () => {
		// The caret above the appender: the closest field wins.
		expect( getClosestTabbable( next, false, container, true, 580 ) ).toBe(
			two
		);
	} );

	it( 'should keep DOM order for a row of blocks', () => {
		expect(
			getClosestTabbable( middle, false, container, true, 500 )
		).toBe( left );
		expect( getClosestTabbable( last, true, container, true, 100 ) ).toBe(
			right
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
