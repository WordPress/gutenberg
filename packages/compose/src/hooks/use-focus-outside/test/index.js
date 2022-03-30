/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useFocusOutside from '../';

let container, onFocusOutside, root;

describe( 'useFocusOutside', () => {
	let origHasFocus;

	const FocusOutsideComponent = ( { onFocusOutside: callback } ) => (
		<div { ...useFocusOutside( callback ) }>
			<input />
			<input type="button" />
		</div>
	);

	const simulateEvent = ( event, index = 0 ) => {
		const element = container.querySelectorAll( 'input' );
		TestUtils.Simulate[ event ]( element[ index ] );
	};

	beforeEach( () => {
		// Mock document.hasFocus() to always be true for testing
		// note: we overide this for some tests.
		origHasFocus = document.hasFocus;
		document.hasFocus = () => true;

		onFocusOutside = jest.fn();

		container = document.createElement( 'div' );
		root = createRoot( container );
		root.render(
			<FocusOutsideComponent onFocusOutside={ onFocusOutside } />
		);
		jest.runAllTimers();
	} );

	afterEach( () => {
		document.hasFocus = origHasFocus;
	} );

	it( 'should not call handler if focus shifts to element within component', () => {
		simulateEvent( 'focus' );
		simulateEvent( 'blur' );
		simulateEvent( 'focus', 1 );

		jest.runAllTimers();

		expect( onFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should not call handler if focus transitions via click to button', () => {
		simulateEvent( 'focus' );
		simulateEvent( 'mouseDown', 1 );
		simulateEvent( 'blur' );

		// In most browsers, the input at index 1 would receive a focus event
		// at this point, but this is not guaranteed, which is the intention of
		// the normalization behavior tested here.
		simulateEvent( 'mouseUp', 1 );

		jest.runAllTimers();

		expect( onFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should call handler if focus doesn’t shift to element within component', () => {
		simulateEvent( 'focus' );
		simulateEvent( 'blur' );

		jest.runAllTimers();

		expect( onFocusOutside ).toHaveBeenCalled();
	} );

	it( 'should not call handler if focus shifts outside the component when the document does not have focus', () => {
		// Force document.hasFocus() to return false to simulate the window/document losing focus
		// See https://developer.mozilla.org/en-US/docs/Web/API/Document/hasFocus.
		document.hasFocus = () => false;

		simulateEvent( 'focus' );
		simulateEvent( 'blur' );

		jest.runAllTimers();

		expect( onFocusOutside ).not.toHaveBeenCalled();
	} );

	it( 'should cancel check when unmounting while queued', () => {
		simulateEvent( 'focus' );
		simulateEvent( 'input' );

		root.unmount();
		jest.runAllTimers();

		expect( onFocusOutside ).not.toHaveBeenCalled();
	} );
} );
