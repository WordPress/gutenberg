/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Tooltip from '../';
/**
 * WordPress dependencies
 */
import { TOOLTIP_DELAY } from '../index.js';

describe( 'Tooltip', () => {
	describe( '#render()', () => {
		it( 'should render children (abort) if multiple children passed', () => {
			render(
				<Tooltip position="bottom right" text="Help text">
					<button>Button 1</button>
					<button>Button 2</button>
				</Tooltip>
			);

			const button = screen.getByText( 'Button 1' );
			button.focus();
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
		} );

		it( 'should render children', () => {
			render(
				<Tooltip position="bottom right" text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			expect( button.nodeName ).toBe( 'BUTTON' );
			expect( button.childNodes ).toHaveLength( 1 );
			expect( button ).toHaveTextContent( 'Hover Me!' );
		} );

		it( 'should render children with additional popover when over', () => {
			const { container } = render(
				<Tooltip position="bottom right" text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			button.focus();
			expect( button.nodeName ).toBe( 'BUTTON' );
			expect( button.childNodes ).toHaveLength( 2 );
			expect( button.childNodes[ 0 ] ).toHaveTextContent( 'Hover Me!' );

			const popover =
				container.getElementsByClassName( 'components-popover' );
			expect( popover ).toHaveLength( 1 );
			expect( popover[ 0 ].firstChild ).toHaveTextContent( 'Help text' );
		} );

		it( 'should show popover on focus', () => {
			const originalFocus = jest.fn();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalFocus }
						onFocus={ originalFocus }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			button.focus();

			const popover =
				container.getElementsByClassName( 'components-popover' );
			expect( originalFocus ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
				} )
			);
			expect( popover ).toHaveLength( 1 );
		} );

		it( 'should not show popover on focus as result of mousedown', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const originalOnMouseDown = jest.fn();
			const originalOnMouseUp = jest.fn();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseDown={ originalOnMouseDown }
						onMouseUp={ originalOnMouseUp }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			// Hovers the button and press the left mouse button
			await user.pointer( [
				{ target: button },
				{ keys: '[MouseLeft]', target: button },
			] );
			expect( originalOnMouseDown ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'mousedown',
				} )
			);

			const popover =
				container.getElementsByClassName( 'components-popover' );
			expect( popover ).toHaveLength( 0 );

			// Release the left mouse button
			await user.pointer( [ { keys: '[/MouseLeft]', target: button } ] );
			expect( originalOnMouseUp ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'mouseup',
				} )
			);
		} );

		it( 'should show popover on delayed mouseenter', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						<span>Hover Me!</span>
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			await user.hover( button );
			const popoverBeforeTimeout =
				container.getElementsByClassName( 'components-popover' );
			expect( popoverBeforeTimeout ).toHaveLength( 0 );
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Force delayedSetIsOver to be called.
			setTimeout( () => {
				const popoverAfterTimeout =
					container.getElementsByClassName( 'components-popover' );
				expect( popoverAfterTimeout ).toHaveLength( 1 );

				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, TOOLTIP_DELAY );
		} );

		it( 'should respect custom delay prop when showing popover', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			const { container } = render(
				<Tooltip text="Help text" delay={ 2000 }>
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						<span>Hover Me!</span>
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			await user.hover( button );
			const popoverBeforeTimeout =
				container.getElementsByClassName( 'components-popover' );
			expect( popoverBeforeTimeout ).toHaveLength( 0 );
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Popover does not yet exist after default delay, because custom delay is passed.
			setTimeout( () => {
				const popoverBetweenTimeout =
					container.getElementsByClassName( 'components-popover' );
				expect( popoverBetweenTimeout ).toHaveLength( 0 );
			}, TOOLTIP_DELAY );
			// Popover appears after custom delay.
			setTimeout( () => {
				const popoverAfterTimeout =
					container.getElementsByClassName( 'components-popover' );
				expect( popoverAfterTimeout ).toHaveLength( 1 );
				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, 2000 );
		} );

		it( 'should show tooltip when an element is disabled', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const { container } = render(
				<Tooltip text="Show helpful text here">
					<button disabled>Click me</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			const buttonRect = button.getBoundingClientRect();
			const eventCatcher =
				container.getElementsByClassName( 'event-catcher' )[ 0 ];
			const eventCatcherRect = eventCatcher.getBoundingClientRect();
			expect( buttonRect ).toEqual( eventCatcherRect );

			await user.hover( eventCatcher );

			setTimeout( () => {
				const popover =
					container.getElementsByClassName( 'components-popover' );
				expect( popover ).toHaveLength( 1 );
			}, TOOLTIP_DELAY );
		} );

		it( 'should not emit events back to children when they are disabled', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const handleClick = jest.fn();
			const { container } = render(
				<Tooltip text="Show helpful text here">
					<button disabled onClick={ handleClick }>
						Click me
					</button>
				</Tooltip>
			);

			const eventCatcher =
				container.getElementsByClassName( 'event-catcher' )[ 0 ];
			await user.click( eventCatcher );
			expect( handleClick ).not.toHaveBeenCalled();
		} );

		it( 'should cancel pending setIsOver on mouseleave', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const originalMouseEnter = jest.fn();
			const { container } = render(
				<Tooltip text="Help text">
					<button
						onMouseEnter={ originalMouseEnter }
						onFocus={ originalMouseEnter }
					>
						Hover Me!
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			await user.hover( button );
			setTimeout( () => {
				const popover =
					container.getElementsByClassName( 'components-popover' );
				expect( popover ).toHaveLength( 0 );
			}, TOOLTIP_DELAY );
		} );
	} );
} );
