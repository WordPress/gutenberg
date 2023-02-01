/**
 * External dependencies
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Tooltip from '../';
/**
 * WordPress dependencies
 */
import { TOOLTIP_DELAY } from '../index.js';

jest.useFakeTimers();

function getWrappingPopoverElement( element ) {
	return element.closest( '.components-popover' );
}

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
			act( () => button.focus() );
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
			).toBeVisible();
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();
		} );

		it( 'should render children with additional tooltip when focused', async () => {
			const mockOnFocus = jest.fn();

			render(
				<Tooltip text="Help text">
					<button onFocus={ mockOnFocus }>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { name: 'Hover Me!' } );
			expect( button ).toBeVisible();

			// Before focus, the tooltip is not shown.
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();

			act( () => button.focus() );

			// Tooltip is shown after focusing the anchor.
			const tooltip = screen.getByText( 'Help text' );
			expect( tooltip ).toBeVisible();
			expect( mockOnFocus ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
				} )
			);

			// Wait for the tooltip element to be positioned (aligned with the button)
			await waitFor( () =>
				expect(
					getWrappingPopoverElement( tooltip )
				).toBePositionedPopover()
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
			expect( button ).toBeVisible();

			await user.hover( button );

			// Tooltip hasn't appeared yet
			expect( screen.queryByText( 'Help text' ) ).not.toBeInTheDocument();

			act( () => jest.advanceTimersByTime( TOOLTIP_DELAY ) );

			// Tooltip shows after the delay
			const tooltip = screen.getByText( 'Help text' );
			expect( tooltip ).toBeVisible();

			// Wait for the tooltip element to be positioned (aligned with the button)
			await waitFor( () =>
				expect(
					getWrappingPopoverElement( tooltip )
				).toBePositionedPopover()
			);
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
			expect( button ).toBeVisible();

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
			expect( button ).toBeVisible();

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
			const tooltip = screen.getByText( 'Help text' );
			expect( tooltip ).toBeVisible();

			expect( mockOnFocus ).not.toHaveBeenCalled();

			// Wait for the tooltip element to be positioned (aligned with the button)
			await waitFor( () =>
				expect(
					getWrappingPopoverElement( tooltip )
				).toBePositionedPopover()
			);
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
			expect( button ).toBeVisible();
			expect( button ).toBeDisabled();

			// Note: this is testing for implementation details,
			// but couldn't find a better way.
			const buttonRect = button.getBoundingClientRect();
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
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
			const tooltip = screen.getByText( 'Show helpful text here' );
			expect( tooltip ).toBeVisible();

			// Wait for the tooltip element to be positioned (aligned with the button)
			await waitFor( () =>
				expect(
					getWrappingPopoverElement( tooltip )
				).toBePositionedPopover()
			);
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

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const eventCatcher = container.querySelector( '.event-catcher' );
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

		it( 'should render the shortcut display text when a string is passed as the shortcut', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render(
				<Tooltip text="Help text" shortcut="shortcut text">
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { name: 'Hover Me!' } );
			await user.hover( button );

			const tooltip = await screen.findByText( 'shortcut text' );
			expect( tooltip ).toBeVisible();

			// Wait for the tooltip element to be positioned (aligned with the button)
			await waitFor( () =>
				expect(
					getWrappingPopoverElement( tooltip )
				).toBePositionedPopover()
			);
		} );

		it( 'should render the shortcut display text and aria-label when an object is passed as the shortcut with the correct properties', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render(
				<Tooltip
					text="Help text"
					shortcut={ {
						display: 'shortcut text',
						ariaLabel: 'shortcut label',
					} }
				>
					<button>Hover Me!</button>
				</Tooltip>
			);

			const button = screen.getByRole( 'button', { name: 'Hover Me!' } );
			await user.hover( button );

			const tooltip = await screen.findByLabelText( 'shortcut label' );
			expect( tooltip ).toHaveTextContent( 'shortcut text' );

			// Wait for the tooltip element to be positioned (aligned with the button)
			await waitFor( () =>
				expect(
					getWrappingPopoverElement( tooltip )
				).toBePositionedPopover()
			);
		} );
	} );
} );
