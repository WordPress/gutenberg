/**
 * External dependencies
 */
import { render, screen, act } from '@testing-library/react';
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
			const mockOnFocus = jest.fn();

			render(
				<Tooltip text="Help text">
					<button onFocus={ mockOnFocus }>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { name: 'Hover Me!' } );
			expect( button ).toBeInTheDocument();

			// Before focus, the tooltip is not shown.
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();

			button.focus();

			// Tooltip is shown after focusing the anchor.
			expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
			expect( mockOnFocus ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
				} )
			);
		} );

		it( 'should render children with additional tooltip when hovered', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render(
				<Tooltip text="Help text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { name: 'Hover Me!' } );
			expect( button ).toBeInTheDocument();

			await user.hover( button );

			// Tooltip hasn't appeared yet
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();

			act( () => jest.advanceTimersByTime( TOOLTIP_DELAY ) );

			// Tooltip shows after the delay
			expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();
		} );

		it( 'should not show tooltip on focus as result of mouse click', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			const mockOnFocus = jest.fn();

			render(
				<Tooltip text="Help text">
					<button onFocus={ mockOnFocus }>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { text: 'Hover Me!' } );
			expect( button ).toBeInTheDocument();

			await user.click( button );

			// Tooltip hasn't appeared yet
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();

			act( () => jest.advanceTimersByTime( TOOLTIP_DELAY ) );

			// Tooltip still hasn't appeared yet, even though the component was focused
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
			expect( mockOnFocus ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
				} )
			);
		} );

		it( 'should respect custom delay prop when showing tooltip', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const TEST_DELAY = TOOLTIP_DELAY * 2;
			const mockOnMouseEnter = jest.fn();
			const mockOnFocus = jest.fn();

			render(
				<Tooltip text="Help text" delay={ TEST_DELAY }>
					<button
						onMouseEnter={ mockOnMouseEnter }
						onFocus={ mockOnFocus }
					>
						<span>Hover Me!</span>
					</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { name: 'Hover Me!' } );
			expect( button ).toBeInTheDocument();

			await user.hover( button );

			// Tooltip hasn't appeared yet
			expect( mockOnMouseEnter ).toHaveBeenCalledTimes( 1 );

			// Advance by the usual TOOLTIP_DELAY
			act( () => jest.advanceTimersByTime( TOOLTIP_DELAY ) );

			// Tooltip hasn't appeared yet after the usual delay
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();

			// Advance time again, so that we reach the full TEST_DELAY time
			act( () => jest.advanceTimersByTime( TEST_DELAY - TOOLTIP_DELAY ) );

			// Tooltip shows after TEST_DELAY time
			expect( screen.getByText( 'Help text' ) ).toBeInTheDocument();

			expect( mockOnFocus ).not.toHaveBeenCalled();
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

			const button = screen.getByRole( 'button', { name: 'Click me' } );
			expect( button ).toBeInTheDocument();
			expect( button ).toBeDisabled();

			// Note: this is testing for implementation details,
			// but couldn't find a better way.
			const buttonRect = button.getBoundingClientRect();
			const eventCatcher = container.querySelector( '.event-catcher' );
			const eventCatcherRect = eventCatcher.getBoundingClientRect();
			expect( buttonRect ).toEqual( eventCatcherRect );

			await user.hover( eventCatcher );

			// Tooltip hasn't appeared yet
			expect(
				screen.queryByText( 'Show helpful text here' )
			).not.toBeInTheDocument();

			act( () => jest.advanceTimersByTime( TOOLTIP_DELAY ) );

			// Tooltip shows after the delay
			expect(
				screen.getByText( 'Show helpful text here' )
			).toBeInTheDocument();
		} );

		it( 'should not emit events back to children when they are disabled', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const onClickMock = jest.fn();
			const { container } = render(
				<Tooltip text="Show helpful text here">
					<button disabled onClick={ onClickMock }>
						Click me
					</button>
				</Tooltip>
			);

			const eventCatcher =
				container.getElementsByClassName( 'event-catcher' )[ 0 ];
			await user.click( eventCatcher );
			expect( onClickMock ).not.toHaveBeenCalled();
		} );

		it( 'should not show tooltip if the mouse leaves the anchor before the tooltip has shown', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const MOUSE_LEAVE_DELAY = TOOLTIP_DELAY - 200;
			const onMouseEnterMock = jest.fn();
			const onMouseLeaveMock = jest.fn();

			render(
				<>
					<Tooltip text="Help text">
						<button
							onMouseEnter={ onMouseEnterMock }
							onMouseLeave={ onMouseLeaveMock }
						>
							Hover Me!
						</button>
					</Tooltip>
					<button>Hover me instead!</button>
				</>
			);

			const externalButton = screen.getByRole( 'button', {
				name: 'Hover me instead!',
			} );
			const tooltipButton = screen.getByRole( 'button', {
				name: 'Hover Me!',
			} );

			await user.hover( tooltipButton );

			// Tooltip hasn't appeared yet
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
			expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );

			// Advance time by MOUSE_LEAVE_DELAY time
			act( () => jest.advanceTimersByTime( MOUSE_LEAVE_DELAY ) );

			// Hover the other button, meaning that the mouse will leave the tooltip anchor
			await user.hover( externalButton );

			// Tooltip still hasn't appeared yet
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
			expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );
			expect( onMouseLeaveMock ).toHaveBeenCalledTimes( 1 );

			// Advance time again, so that we reach the full TOOLTIP_DELAY time
			act( () => jest.advanceTimersByTime( TOOLTIP_DELAY ) );

			// Tooltip won't show, since the mouse has left the anchor
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
		} );
	} );
} );
