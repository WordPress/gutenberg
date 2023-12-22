/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { shortcutAriaLabel } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Button from '../../button';
import Modal from '../../modal';
import Tooltip, { TOOLTIP_DELAY } from '..';
import cleanupTooltip from './utils/';

const props = {
	children: <Button>Tooltip anchor</Button>,
	text: 'tooltip text',
};

describe( 'Tooltip', () => {
	it( 'should not render the tooltip if multiple children are passed', async () => {
		render(
			// expected TS error since Tooltip cannot have more than one child element
			// @ts-expect-error
			<Tooltip { ...props }>
				<Button>This is a button</Button>
				<Button>This is another button</Button>
			</Tooltip>
		);

		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render the tooltip if there is no focus', () => {
		render( <Tooltip { ...props } /> );

		expect(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		).toBeVisible();

		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the tooltip when focusing on the tooltip anchor via tab', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		await user.tab();

		expect(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		).toHaveFocus();

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await cleanupTooltip( user );
	} );

	it( 'should render the tooltip when the tooltip anchor is hovered', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		await user.hover(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		);

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await cleanupTooltip( user );
	} );

	it( 'should not show tooltip on focus as result of mouse click', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		);

		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();

		await cleanupTooltip( user );
	} );

	it( 'should respect custom delay prop when showing tooltip', async () => {
		const user = userEvent.setup();
		const ADDITIONAL_DELAY = 100;

		render(
			<Tooltip { ...props } delay={ TOOLTIP_DELAY + ADDITIONAL_DELAY } />
		);

		await user.hover(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		);

		// Advance time by default delay
		await new Promise( ( resolve ) =>
			setTimeout( resolve, TOOLTIP_DELAY )
		);

		// Tooltip hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();

		// wait for additional delay for tooltip to appear
		await waitFor(
			() =>
				new Promise( ( resolve ) =>
					setTimeout( resolve, ADDITIONAL_DELAY )
				)
		);

		expect(
			screen.getByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await cleanupTooltip( user );
	} );

	it( 'should show tooltip when an element is disabled', async () => {
		const user = userEvent.setup();

		render(
			<Tooltip { ...props }>
				<Button aria-disabled>Button</Button>
			</Tooltip>
		);

		const button = screen.getByRole( 'button', { name: 'Tooltip anchor' } );

		expect( button ).toBeVisible();
		expect( button ).toHaveAttribute( 'aria-disabled' );

		await user.hover( button );

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await cleanupTooltip( user );
	} );

	it( 'should not show tooltip if the mouse leaves the tooltip anchor before set delay', async () => {
		const user = userEvent.setup();
		const onMouseEnterMock = jest.fn();
		const onMouseLeaveMock = jest.fn();
		const MOUSE_LEAVE_DELAY = TOOLTIP_DELAY - 200;

		render(
			<>
				<Tooltip { ...props }>
					<Button
						onMouseEnter={ onMouseEnterMock }
						onMouseLeave={ onMouseLeaveMock }
					>
						Tooltip anchor
					</Button>
				</Tooltip>
				<Button>Other button</Button>
			</>
		);

		await user.hover(
			screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} )
		);

		// Tooltip hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();
		expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );

		// Advance time by MOUSE_LEAVE_DELAY time
		await new Promise( ( resolve ) =>
			setTimeout( resolve, MOUSE_LEAVE_DELAY )
		);

		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();

		// Hover the other button, meaning that the mouse will leave the tooltip anchor
		await user.hover(
			screen.getByRole( 'button', {
				name: 'Other button',
			} )
		);

		// Tooltip still hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();
		expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );
		expect( onMouseLeaveMock ).toHaveBeenCalledTimes( 1 );

		// Advance time again, so that we reach the full TOOLTIP_DELAY time
		await new Promise( ( resolve ) =>
			setTimeout( resolve, TOOLTIP_DELAY )
		);

		// Tooltip won't show, since the mouse has left the tooltip anchor
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();

		await cleanupTooltip( user );
	} );

	it( 'should render the shortcut display text when a string is passed as the shortcut', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } shortcut="shortcut text" /> );

		await user.hover(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		);

		await waitFor( () =>
			expect( screen.getByText( 'shortcut text' ) ).toBeVisible()
		);

		await cleanupTooltip( user );
	} );

	it( 'should render the keyboard shortcut display text and aria-label when an object is passed as the shortcut', async () => {
		const user = userEvent.setup();

		render(
			<Tooltip
				{ ...props }
				shortcut={ {
					display: '⇧⌘,',
					ariaLabel: shortcutAriaLabel.primaryShift( ',' ),
				} }
			/>
		);

		await user.hover(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		);

		await waitFor( () =>
			expect( screen.getByText( '⇧⌘,' ) ).toBeVisible()
		);

		expect( screen.getByText( '⇧⌘,' ) ).toHaveAttribute(
			'aria-label',
			'Control + Shift + Comma'
		);

		await cleanupTooltip( user );
	} );

	it( 'esc should close modal even when tooltip is visible', async () => {
		const user = userEvent.setup();
		const onRequestClose = jest.fn();
		render(
			<Modal onRequestClose={ onRequestClose }>
				<p>Modal content</p>
			</Modal>
		);

		expect(
			screen.queryByRole( 'tooltip', { name: /close/i } )
		).not.toBeInTheDocument();

		await user.hover(
			screen.getByRole( 'button', {
				name: /close/i,
			} )
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /close/i } )
			).toBeVisible()
		);

		await user.keyboard( '[Escape]' );

		expect( onRequestClose ).toHaveBeenCalled();

		await cleanupTooltip( user );
	} );

	it( 'should associate the tooltip text with its anchor via the accessible description when visible', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		await user.hover(
			screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} )
		);

		expect(
			await screen.findByRole( 'button', { description: 'tooltip text' } )
		).toBeInTheDocument();
	} );

	it( 'should not hide tooltip when the anchor is clicked if hideOnClick is false', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } hideOnClick={ false } /> );

		const button = screen.getByRole( 'button', { name: 'Tooltip anchor' } );

		await user.hover( button );

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await user.click( button );

		expect(
			screen.getByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await cleanupTooltip( user );
	} );
} );
