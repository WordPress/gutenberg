/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Popover from '../';

jest.useFakeTimers();

class PopoverWrapper extends Component {
	render() {
		return <Popover { ...this.props } />;
	}
}

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

		// An ideal test here would mount with an input child and focus the
		// child, but in context of JSDOM the inputs are not visible and
		// are therefore skipped as tabbable, defaulting to popover.
		let wrapper;
		TestUtils.act( () => {
			wrapper = TestUtils.renderIntoDocument( <PopoverWrapper /> );

			jest.advanceTimersByTime( 1 );

			const content = TestUtils.findRenderedDOMComponentWithClass(
				wrapper,
				'components-popover__content'
			);
			expect( document.activeElement ).toBe( content );
		} );
	} );

	it( 'should allow focus-on-open behavior to be disabled', () => {
		const activeElement = document.activeElement;
		TestUtils.act( () => {
			TestUtils.renderIntoDocument( <Popover focusOnMount={ false } /> );

			jest.advanceTimersByTime( 1 );

			expect( document.activeElement ).toBe( activeElement );
		} );
	} );

	it( 'should render content', () => {
		let wrapper;
		TestUtils.act( () => {
			wrapper = TestUtils.renderIntoDocument( <PopoverWrapper>Hello</PopoverWrapper> );
		} );
		const content = TestUtils.findRenderedDOMComponentWithTag( wrapper, 'span' );

		expect( content ).toMatchSnapshot();
	} );

	it( 'should pass additional props to portaled element', () => {
		let wrapper;
		TestUtils.act( () => {
			wrapper = TestUtils.renderIntoDocument( <PopoverWrapper role="tooltip">Hello</PopoverWrapper> );
		} );
		const content = TestUtils.findRenderedDOMComponentWithTag( wrapper, 'span' );

		expect( content ).toMatchSnapshot();
	} );
} );
