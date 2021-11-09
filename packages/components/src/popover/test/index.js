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
