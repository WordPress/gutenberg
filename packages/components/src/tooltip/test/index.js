/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

/**
 * Internal dependencies
 */
import Tooltip from '../';
/**
 * WordPress dependencies
 */
import { TOOLTIP_DELAY } from '../index.js';
import { act } from '@testing-library/react';

describe( 'Tooltip', () => {
	describe( '#render()', () => {
		it( 'should render children (abort) if multiple children passed', () => {
			// Mount: Enzyme shallow does not support wrapping multiple nodes
			const wrapper = mount(
				<Tooltip>
					<div />
					<div />
				</Tooltip>
			);

			expect( wrapper.children() ).toHaveLength( 2 );
		} );

		it( 'should render children', () => {
			const wrapper = shallow(
				<Tooltip position="bottom right" text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );
			expect( wrapper.type() ).toBe( 'button' );
			expect( button.children() ).toHaveLength( 1 );
			expect( button.childAt( 0 ).text() ).toBe( 'Hover Me!' );
		} );

		it( 'should render children with additional popover when over', () => {
			const wrapper = shallow(
				<Tooltip position="bottom right" text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const event = { type: 'focus', currentTarget: {} };
			wrapper.simulate( 'focus', event );

			const button = wrapper.find( 'button' );
			const popover = wrapper.find( 'ForwardRef(Popover)' );
			expect( wrapper.type() ).toBe( 'button' );
			expect( button.children() ).toHaveLength( 2 );
			expect( button.childAt( 0 ).text() ).toBe( 'Hover Me!' );
			expect( button.childAt( 1 ).name() ).toBe( 'ForwardRef(Popover)' );
			expect( popover.prop( 'focusOnMount' ) ).toBe( false );
			expect( popover.prop( 'position' ) ).toBe( 'bottom right' );
			expect( popover.children().first().text() ).toBe( 'Help text' );
		} );

		it( 'should show popover on focus', () => {
			const originalFocus = jest.fn();
			const event = { type: 'focus', currentTarget: {} };
			const wrapper = shallow(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalFocus }
						onFocus={ originalFocus }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );
			button.simulate( 'focus', event );

			const popover = wrapper.find( 'ForwardRef(Popover)' );
			expect( originalFocus ).toHaveBeenCalledWith( event );
			expect( popover ).toHaveLength( 1 );
		} );

		it( 'should show not popover on focus as result of mousedown', async () => {
			const originalOnMouseDown = jest.fn();
			const originalOnMouseUp = jest.fn();
			const wrapper = mount(
				<Tooltip text="Help text">
					<button
						onMouseDown={ originalOnMouseDown }
						onMouseUp={ originalOnMouseUp }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );

			let event;

			event = { type: 'mousedown' };
			button.simulate( event.type, event );
			expect( originalOnMouseDown ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: event.type,
				} )
			);

			event = { type: 'focus', currentTarget: {} };
			button.simulate( event.type, event );

			const popover = wrapper.find( 'Popover' );
			expect( popover ).toHaveLength( 0 );

			event = new window.MouseEvent( 'mouseup' );
			await act( async () => document.dispatchEvent( event ) );
			expect( originalOnMouseUp ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: event.type,
				} )
			);
		} );

		it( 'should show popover on delayed mouseenter', () => {
			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			const wrapper = mount(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						<span>Hover Me!</span>
					</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );
			button.simulate( 'mouseenter', { type: 'mouseenter' } );

			const popoverBeforeTimeout = wrapper.find( 'Popover' );
			expect( popoverBeforeTimeout ).toHaveLength( 0 );
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Force delayedSetIsOver to be called
			setTimeout( () => {
				const popoverAfterTimeout = wrapper.find( 'Popover' );
				expect( popoverAfterTimeout ).toHaveLength( 1 );
			}, TOOLTIP_DELAY );
		} );

		it( 'should show tooltip when an element is disabled', () => {
			const wrapper = mount(
				<Tooltip text="Show helpful text here">
					<button disabled>Click me</button>
				</Tooltip>
			);
			const button = wrapper.find( 'button[disabled]' );
			const buttonNode = button.at( 0 ).getDOMNode();
			const buttonRect = buttonNode.getBoundingClientRect();
			const eventCatcher = wrapper.find( '.event-catcher' );
			const eventCatcherNode = eventCatcher.at( 0 ).getDOMNode();
			const eventCatcherRect = eventCatcherNode.getBoundingClientRect();
			expect( buttonRect ).toEqual( eventCatcherRect );

			eventCatcher.simulate( 'mouseenter', {
				type: 'mouseenter',
				currentTarget: {},
			} );

			setTimeout( () => {
				const popover = wrapper.find( 'Popover' );
				expect( popover ).toHaveLength( 1 );
			}, TOOLTIP_DELAY );
		} );

		it( 'should cancel pending setIsOver on mouseleave', () => {
			// Mount: Issues with using `setState` asynchronously with shallow-
			// rendered components: https://github.com/airbnb/enzyme/issues/450
			const originalMouseEnter = jest.fn();
			const wrapper = mount(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = wrapper.find( 'button' );
			button.simulate( 'mouseenter' );

			setTimeout( () => {
				const popover = wrapper.find( 'Popover' );
				expect( popover ).toHaveLength( 0 );
			}, TOOLTIP_DELAY );
		} );
	} );
} );
