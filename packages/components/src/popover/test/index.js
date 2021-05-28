/**
 * External dependencies
 */
import { act, render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Popover from '../';

describe( 'Popover', () => {
	afterEach( () => {
		if ( document.activeElement ) {
			document.activeElement.blur();
		}
	} );

	it( 'should focus when opening in response to keyboard event', () => {
		// As in the real world, these occur in sequence before the popover
		// has been mounted. Keyup's resetting is deferred.
		document.dispatchEvent( new window.KeyboardEvent( 'keydown' ) );
		document.dispatchEvent( new window.KeyboardEvent( 'keyup' ) );

		expect( document.activeElement ).toBe( document.body );

		// An ideal test here would mount with an input child and focus the
		// child, but in context of JSDOM the inputs are not visible and
		// are therefore skipped as tabbable, defaulting to popover.
		let result;
		act( () => {
			result = render( <Popover /> );

			jest.advanceTimersByTime( 1 );
		} );

		expect( document.activeElement ).toBe(
			result.container.querySelector( '.components-popover' )
		);
	} );

	it( 'should allow focus-on-open behavior to be disabled', () => {
		expect( document.activeElement ).toBe( document.body );

		act( () => {
			render( <Popover focusOnMount={ false } /> );

			jest.advanceTimersByTime( 1 );
		} );

		expect( document.activeElement ).toBe( document.body );
	} );

	it( 'should render content', () => {
		let result;
		act( () => {
			result = render( <Popover>Hello</Popover> );
		} );

		expect( result.container.querySelector( 'span' ) ).toMatchSnapshot();
	} );

	it( 'should pass additional props to portaled element', () => {
		let result;
		act( () => {
			result = render( <Popover role="tooltip">Hello</Popover> );
		} );

		expect( result.container.querySelector( 'span' ) ).toMatchSnapshot();
	} );
} );
