import { afterEach, describe, expect, test, vi } from 'vitest';
import { addDelegatedListeners } from '..';

function createEditable() {
	const element = document.createElement( 'div' );
	// jsdom does not implement `contentEditable`.
	Object.defineProperty( element, 'contentEditable', { value: 'true' } );
	element.tabIndex = 0;
	document.body.append( element );
	return element;
}

describe( 'addDelegatedListeners', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	test( 'calls target handlers for the elements on the path from the target', () => {
		const outer = document.createElement( 'div' );
		const inner = document.createElement( 'div' );
		outer.append( inner );
		document.body.append( outer );
		const calls: string[] = [];
		const listeners = {
			default: {
				click: {
					target: [
						( { props }: any ) => calls.push( props.current ),
					],
				},
			},
		};
		addDelegatedListeners( outer, listeners, { current: 'outer' } );
		addDelegatedListeners( inner, listeners, { current: 'inner' } );

		inner.dispatchEvent( new Event( 'click', { bubbles: true } ) );

		expect( calls ).toEqual( [ 'inner', 'outer' ] );
	} );

	test( 'calls selection handlers only for the element that owns the selection', () => {
		const owner = createEditable();
		const other = createEditable();
		const handler = vi.fn();
		const listeners = {
			first: { keydown: { selection: [ handler ] } },
		};
		addDelegatedListeners( owner, listeners, { current: {} } );
		addDelegatedListeners( other, listeners, { current: {} } );
		owner.focus();

		const event = new KeyboardEvent( 'keydown', { bubbles: true } );
		owner.dispatchEvent( event );

		expect( handler ).toHaveBeenCalledTimes( 1 );
		expect( handler.mock.calls[ 0 ][ 0 ].element ).toBe( owner );
		expect( handler.mock.calls[ 0 ][ 1 ] ).toBe( event );
	} );

	test( 'calls the handlers of an element in the order they were added', () => {
		const element = createEditable();
		const calls: string[] = [];
		addDelegatedListeners(
			element,
			{ first: { input: { selection: [ () => calls.push( 'a' ) ] } } },
			{ current: {} }
		);
		addDelegatedListeners(
			element,
			{ first: { input: { selection: [ () => calls.push( 'b' ) ] } } },
			{ current: {} }
		);
		element.focus();

		element.dispatchEvent( new Event( 'input', { bubbles: true } ) );

		expect( calls ).toEqual( [ 'a', 'b' ] );
	} );

	test( 'runs first handlers before element listeners and default handlers after them', () => {
		const element = createEditable();
		const calls: string[] = [];
		addDelegatedListeners(
			element,
			{
				first: {
					paste: { selection: [ () => calls.push( 'first' ) ] },
				},
				default: {
					paste: { selection: [ () => calls.push( 'default' ) ] },
				},
			},
			{ current: {} }
		);
		element.addEventListener( 'paste', () => calls.push( 'element' ) );
		element.focus();

		element.dispatchEvent( new Event( 'paste', { bubbles: true } ) );

		expect( calls ).toEqual( [ 'first', 'element', 'default' ] );
	} );

	test( 'stops calling the handlers once removed', () => {
		const element = createEditable();
		const handler = vi.fn();
		const remove = addDelegatedListeners(
			element,
			{ default: { focusin: { target: [ handler ] } } },
			{ current: {} }
		);

		remove();
		element.focus();

		expect( handler ).not.toHaveBeenCalled();
	} );
} );
