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
		it( 'should not render the tooltip if multiple children are passed', () => {
			render(
				<Tooltip text="Help text">
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
				<Tooltip text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			expect(
				screen.getByRole( 'button', { name: 'Hover Me!' } )
			).toBeInTheDocument();
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
		} );

		it( 'should render children with additional tooltip when focused', () => {
			render(
				<Tooltip text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			button.focus();
			expect(
				screen.getByRole( 'button', { name: 'Hover Me!' } )
			).toBeInTheDocument();
			expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
		} );

		it( 'should render children with additional tooltip when hovered', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			jest.useFakeTimers();

			render(
				<Tooltip text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			await user.hover( button );

			expect(
				screen.getByRole( 'button', { name: 'Hover Me!' } )
			).toBeInTheDocument();

			setTimeout( () => {
				expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, TOOLTIP_DELAY );
		} );

		it( 'should show tooltip on focus', () => {
			const originalFocus = jest.fn();
			render(
				<Tooltip text="Help text">
					<button onFocus={ originalFocus }>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			button.focus();
			expect( originalFocus ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
				} )
			);
			expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
		} );

		it( 'should not show tooltip on focus as result of mouse click', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			jest.useFakeTimers();

			render(
				<Tooltip text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button' );
			await user.click( button );
			setTimeout( () => {
				expect(
					screen.queryByText( 'Help text' )
				).not.toBeInTheDocument();
				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, TOOLTIP_DELAY );
		} );

		it( 'should show tooltip on delayed mouseenter', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			render(
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
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			setTimeout( () => {
				expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
				jest.runOnlyPendingTimers();
				jest.useRealTimers();
			}, TOOLTIP_DELAY );
		} );

		it( 'should respect custom delay prop when showing tooltip', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const originalMouseEnter = jest.fn();
			jest.useFakeTimers();
			render(
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
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
			expect( originalMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Tooltip does not yet exist after default delay, because custom delay is passed.
			setTimeout( () => {
				expect(
					screen.queryByText( 'Help text' )
				).not.toBeInTheDocument();
			}, TOOLTIP_DELAY );
			// Tooltip appears after custom delay.
			setTimeout( () => {
				expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
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
				expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
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
			render(
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
				expect(
					screen.queryByText( 'Help text' )
				).not.toBeInTheDocument();
			}, TOOLTIP_DELAY );
		} );
	} );
} );
