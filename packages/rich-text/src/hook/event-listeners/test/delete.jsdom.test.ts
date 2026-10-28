import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import deleteHandler from '../delete';
import { apply } from '../../../to-dom';
import { create } from '../../../create';
import {
	OBJECT_REPLACEMENT_CHARACTER,
	ZWNBSP,
} from '../../../special-characters';
import type { RichTextValue } from '../../../types';
import type { EventListenerProps } from '../../types';

const BACKSPACE = 8;
const DELETE = 46;

function createValue( text: string, start: number, end = start ) {
	return {
		text,
		formats: Array( text.length ),
		replacements: Array( text.length ),
		start,
		end,
	} as RichTextValue;
}

/**
 * Renders the value in a focused editable element with the delete listener
 * attached. The DOM selection is left where `apply` places it.
 *
 * @param value Rich text value with selection.
 */
function setup( value: RichTextValue ) {
	const element = document.createElement( 'div' );
	// jsdom does not implement `contentEditable`.
	Object.defineProperty( element, 'contentEditable', { value: 'true' } );
	element.tabIndex = 0;
	document.body.append( element );
	element.focus();

	apply( { value, current: element } );

	const handleChange = vi.fn();
	const props = {
		current: {
			handleChange,
			createRecord() {
				const selection =
					element.ownerDocument.defaultView!.getSelection()!;
				return create( {
					element,
					range:
						selection.rangeCount > 0
							? selection.getRangeAt( 0 )
							: null,
					__unstableIsEditableTree: true,
				} );
			},
		},
	} as unknown as RefObject< EventListenerProps >;
	const unsubscribe = deleteHandler( props )( element );

	function press( keyCode: number ) {
		const event = new window.KeyboardEvent( 'keydown', {
			keyCode,
			bubbles: true,
			cancelable: true,
		} );
		element.dispatchEvent( event );
		return event;
	}

	function collapse( node: Node | null, offset: number ) {
		element.ownerDocument
			.defaultView!.getSelection()!
			.collapse( node, offset );
	}

	return { element, handleChange, press, collapse, unsubscribe };
}

describe( 'delete listener', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'should remove the character before the padding on Backspace behind it', () => {
		const { element, handleChange, press, collapse, unsubscribe } = setup(
			createValue( 'ab\n', 3 )
		);
		const padding = element.lastChild!;
		expect( padding.nodeValue ).toBe( ZWNBSP );

		// `End` lands the caret after the padding.
		collapse( padding, 1 );
		const event = press( BACKSPACE );

		expect( event.defaultPrevented ).toBe( true );
		expect( handleChange ).toHaveBeenCalledTimes( 1 );
		expect( handleChange.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			text: 'ab',
			start: 2,
			end: 2,
		} );
		unsubscribe();
	} );

	it( 'should leave Backspace before the padding to the browser', () => {
		const { element, handleChange, press, collapse, unsubscribe } = setup(
			createValue( 'ab\n', 3 )
		);
		collapse( element.lastChild, 0 );
		const event = press( BACKSPACE );

		expect( event.defaultPrevented ).toBe( false );
		expect( handleChange ).not.toHaveBeenCalled();
		unsubscribe();
	} );

	it( 'should leave Delete behind the padding to other handlers', () => {
		const { element, handleChange, press, collapse, unsubscribe } = setup(
			createValue( 'ab\n', 3 )
		);
		collapse( element.lastChild, 1 );
		const event = press( DELETE );

		expect( event.defaultPrevented ).toBe( false );
		expect( handleChange ).not.toHaveBeenCalled();
		unsubscribe();
	} );

	it( 'should remove a selected object', () => {
		const value = createValue(
			`ab${ OBJECT_REPLACEMENT_CHARACTER }`,
			2,
			3
		);
		value.replacements[ 2 ] = { type: 'img', attributes: { src: 'x' } };
		const { element, handleChange, press, unsubscribe } = setup( value );
		expect( element.querySelector( 'img' ) ).not.toBeNull();

		const event = press( BACKSPACE );

		expect( event.defaultPrevented ).toBe( true );
		expect( handleChange.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			text: 'ab',
			start: 2,
			end: 2,
		} );
		unsubscribe();
	} );

	it( 'should remove the whole content when it is all selected', () => {
		const { handleChange, press, unsubscribe } = setup(
			createValue( 'ab', 0, 2 )
		);
		const event = press( DELETE );

		expect( event.defaultPrevented ).toBe( true );
		expect( handleChange.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			text: '',
		} );
		unsubscribe();
	} );
} );
