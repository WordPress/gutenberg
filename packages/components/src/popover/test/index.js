/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import TestUtils from 'react-dom/test-utils';
import ReactDOM from 'react-dom';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import Popover from '../';

describe( 'Popover', () => {
	describe( '#componentDidUpdate()', () => {
		let wrapper;
		beforeEach( () => {
			jest.spyOn( Popover.prototype, 'computePopoverPosition' ).mockImplementation( noop );
			jest.spyOn( Popover.prototype, 'toggleWindowEvents' ).mockImplementation( noop );
		} );

		afterEach( () => {
			jest.restoreAllMocks();

			// Resetting keyboard state is deferred, so ensure that timers are
			// consumed to avoid leaking into other tests.
			jest.runAllTimers();

			if ( document.activeElement ) {
				document.activeElement.blur();
			}
		} );

		it( 'should add window events', () => {
			wrapper = TestUtils.renderIntoDocument( <Popover /> );
			expect( Popover.prototype.toggleWindowEvents ).toHaveBeenCalledWith( true );
			expect( Popover.prototype.computePopoverPosition ).toHaveBeenCalled();
		} );

		it( 'should remove window events', () => {
			wrapper = TestUtils.renderIntoDocument( <Popover /> );
			/* eslint-disable react/no-find-dom-node */
			ReactDOM.unmountComponentAtNode( ReactDOM.findDOMNode( wrapper ).parentNode );
			/* eslint-enable react/no-find-dom-node */

			expect( Popover.prototype.toggleWindowEvents ).toHaveBeenCalledWith( false );
		} );

		it( 'should set offset and forced positions on changed position', () => {
			const node = document.createElement( 'div' );
			wrapper = ReactDOM.render( <Popover />, node );
			jest.clearAllMocks();

			ReactDOM.render( <Popover position={ 'bottom right' } />, node );

			expect( Popover.prototype.toggleWindowEvents ).not.toHaveBeenCalled();
			expect( Popover.prototype.computePopoverPosition ).toHaveBeenCalled();
		} );

		it( 'should focus when opening in response to keyboard event', ( done ) => {
			// As in the real world, these occur in sequence before the popover
			// has been mounted. Keyup's resetting is deferred.
			document.dispatchEvent( new window.KeyboardEvent( 'keydown' ) );
			document.dispatchEvent( new window.KeyboardEvent( 'keyup' ) );

			// An ideal test here would mount with an input child and focus the
			// child, but in context of JSDOM the inputs are not visible and
			// are therefore skipped as tabbable, defaulting to popover.
			wrapper = TestUtils.renderIntoDocument( <Popover /> );

			setTimeout( () => {
				const content = TestUtils.findRenderedDOMComponentWithClass(
					wrapper,
					'components-popover__content'
				);
				expect( document.activeElement ).toBe( content );
				done();
			}, 1 );

			jest.runAllTimers();
		} );

		it( 'should allow focus-on-open behavior to be disabled', ( done ) => {
			const activeElement = document.activeElement;

			wrapper = TestUtils.renderIntoDocument( <Popover focusOnMount={ false } /> );

			setTimeout( () => {
				expect( document.activeElement ).toBe( activeElement );
				done();
			} );

			jest.runAllTimers();
		} );
	} );

	describe( '#render()', () => {
		it( 'should render content', () => {
			const wrapper = shallow( <Popover>Hello</Popover>, { disableLifecycleMethods: true } );

			expect( wrapper.type() ).toBe( 'span' );
			expect( wrapper.find( '.components-popover__content' ).prop( 'children' ) ).toBe( 'Hello' );
		} );

		it( 'should pass additional to portaled element', () => {
			const wrapper = shallow( <Popover role="tooltip">Hello</Popover>, { disableLifecycleMethods: true } );

			expect( wrapper.find( '.components-popover' ).prop( 'role' ) ).toBe( 'tooltip' );
		} );
	} );
} );
