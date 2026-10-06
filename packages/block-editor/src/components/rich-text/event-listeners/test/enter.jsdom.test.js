import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	create,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { ENTER } from '@wordpress/keycodes';
import { unlock } from '../../../../lock-unlock';
import enter from '../enter';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const SHIFT = { key: 'Shift', keyCode: 16, shiftKey: true };
const cleanups = [];

function keyDown( element, init ) {
	const event = new window.KeyboardEvent( 'keydown', {
		bubbles: true,
		cancelable: true,
		...init,
	} );
	element.dispatchEvent( event );
	return event;
}

function beforeInput( element, inputType ) {
	const event = new window.InputEvent( 'beforeinput', {
		bubbles: true,
		cancelable: true,
		inputType,
	} );
	element.dispatchEvent( event );
	return event;
}

// jsdom does not turn keys into input events, so this replays the stream the
// fix is written for: Shift+Enter arrives as insertParagraph in Safari
// (#84047) and as insertLineBreak in Chrome and Firefox. It exercises the
// handler, not Safari. Like a browser, it sends no beforeinput for a
// cancelled keydown.
function pressEnter(
	element,
	{ inputType, shiftKey = false, keyCode = ENTER }
) {
	const keydown = keyDown( element, { key: 'Enter', keyCode, shiftKey } );
	if ( ! keydown.defaultPrevented ) {
		return beforeInput( element, inputType );
	}
}

function setup( props ) {
	const element = document.createElement( 'div' );
	element.tabIndex = 0;
	element.textContent = 'hello';
	document.body.append( element );
	element.focus();
	// The caret is at the end, where Enter would split the block.
	document.getSelection().collapse( element.firstChild, 5 );

	const value = { ...create( { text: 'hello' } ), start: 5, end: 5 };
	const current = {
		getValue: () => value,
		onChange: vi.fn(),
		onReplace: vi.fn(),
		onSplit: vi.fn(),
		onSplitAtEnd: vi.fn(),
		supportsSplitting: true,
		...props,
	};

	// Stands in for the use-enter listeners of the paragraph and list item
	// blocks. They subscribe to the same event on the same element, and
	// bail when it has already been cancelled.
	const cancelledBeforeEnter = [];
	cleanups.push(
		subscribeOwnedListener(
			element,
			'beforeinput',
			( event ) => cancelledBeforeEnter.push( event.defaultPrevented ),
			true
		),
		enter( { current } )( element ),
		() => element.remove()
	);

	return { element, props: current, cancelledBeforeEnter };
}

describe( 'enter', () => {
	afterEach( () => {
		cleanups.splice( 0 ).forEach( ( cleanup ) => cleanup() );
		document.getSelection().removeAllRanges();
	} );

	it( 'inserts a line break when Shift+Enter arrives as insertParagraph', () => {
		const { element, props } = setup();

		keyDown( element, SHIFT );
		pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( props.onChange ).toHaveBeenCalledTimes( 1 );
		expect( props.onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { text: 'hello\n' } )
		);
		expect( props.onSplitAtEnd ).not.toHaveBeenCalled();
	} );

	it( 'cancels the Shift+Enter paragraph break before other listeners see it', () => {
		const { element, cancelledBeforeEnter } = setup();

		keyDown( element, SHIFT );
		const event = pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( cancelledBeforeEnter ).toEqual( [ true ] );
		expect( event.defaultPrevented ).toBe( true );
	} );

	it( 'leaves Enter alone when only the shift flag is set, as on the iOS keyboard', () => {
		const { element, props, cancelledBeforeEnter } = setup();

		// The keyboard sets shiftKey on Return while it shows capitals, and is
		// not known to send a Shift key event then.
		pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( cancelledBeforeEnter ).toEqual( [ false ] );
		expect( props.onChange ).not.toHaveBeenCalled();
		expect( props.onSplitAtEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'leaves Enter alone when a key typed without Shift follows Shift', () => {
		const { element, props, cancelledBeforeEnter } = setup();

		keyDown( element, SHIFT );
		keyDown( element, { key: 'a', keyCode: 65, shiftKey: false } );
		pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( cancelledBeforeEnter ).toEqual( [ false ] );
		expect( props.onChange ).not.toHaveBeenCalled();
		expect( props.onSplitAtEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'inserts nothing and cancels the event when line breaks are disabled', () => {
		const { element, props, cancelledBeforeEnter } = setup( {
			disableLineBreaks: true,
			supportsSplitting: false,
			onReplace: undefined,
			onSplit: undefined,
			onSplitAtEnd: undefined,
		} );

		keyDown( element, SHIFT );
		const event = pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( cancelledBeforeEnter ).toEqual( [ true ] );
		expect( event.defaultPrevented ).toBe( true );
		expect( props.onChange ).not.toHaveBeenCalled();
	} );

	it( 'ignores an Enter keydown from IME composition', () => {
		const { element, props, cancelledBeforeEnter } = setup();

		keyDown( element, SHIFT );
		pressEnter( element, {
			shiftKey: true,
			keyCode: 229,
			inputType: 'insertParagraph',
		} );

		expect( cancelledBeforeEnter ).toEqual( [ false ] );
		expect( props.onChange ).not.toHaveBeenCalled();
	} );

	it( 'inserts a line break once when Shift+Enter arrives as insertLineBreak', () => {
		const { element, props } = setup();

		keyDown( element, SHIFT );
		pressEnter( element, {
			shiftKey: true,
			inputType: 'insertLineBreak',
		} );

		expect( props.onChange ).toHaveBeenCalledTimes( 1 );
		expect( props.onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { text: 'hello\n' } )
		);
		expect( props.onSplitAtEnd ).not.toHaveBeenCalled();
	} );

	it( 'keeps the Shift+Enter intent across another input event', () => {
		const { element, props } = setup();

		keyDown( element, SHIFT );
		keyDown( element, { key: 'Enter', keyCode: ENTER, shiftKey: true } );
		// Something else arrives before the paragraph break, such as a
		// correction applied on Return.
		beforeInput( element, 'insertReplacementText' );
		beforeInput( element, 'insertParagraph' );

		expect( props.onChange ).toHaveBeenCalledTimes( 1 );
		expect( props.onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { text: 'hello\n' } )
		);
		expect( props.onSplitAtEnd ).not.toHaveBeenCalled();
	} );

	it( 'ignores Shift+Enter in another editing host', () => {
		const { element, props, cancelledBeforeEnter } = setup();
		const other = document.createElement( 'div' );
		other.tabIndex = 0;
		other.textContent = 'other';
		document.body.append( other );
		cleanups.push( () => other.remove() );
		other.focus();
		document.getSelection().collapse( other.firstChild, 5 );

		keyDown( other, SHIFT );
		const event = pressEnter( other, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( element ).not.toHaveFocus();
		expect( event.defaultPrevented ).toBe( false );
		expect( cancelledBeforeEnter ).toEqual( [] );
		expect( props.onChange ).not.toHaveBeenCalled();
	} );

	// The Caps Lock clause of the tracker is carried over from another
	// editor's iOS handling and is not verified independently of this test.
	it( 'leaves Enter alone after a Caps Lock key', () => {
		const { element, props, cancelledBeforeEnter } = setup();

		keyDown( element, SHIFT );
		keyDown( element, { key: 'CapsLock', keyCode: 20, shiftKey: true } );
		pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );

		expect( cancelledBeforeEnter ).toEqual( [ false ] );
		expect( props.onChange ).not.toHaveBeenCalled();
		expect( props.onSplitAtEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'claims only the event that follows the Shift+Enter keydown', () => {
		const { element, props, cancelledBeforeEnter } = setup();

		keyDown( element, SHIFT );
		pressEnter( element, {
			shiftKey: true,
			inputType: 'insertParagraph',
		} );
		// No keydown, as with dictation or a script.
		beforeInput( element, 'insertParagraph' );

		expect( cancelledBeforeEnter ).toEqual( [ true, false ] );
		expect( props.onChange ).toHaveBeenCalledTimes( 1 );
		expect( props.onSplitAtEnd ).toHaveBeenCalledTimes( 1 );
	} );
} );
