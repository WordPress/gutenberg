/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import { press, hover, click, sleep } from '@ariakit/test';

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

const props = {
	children: <Button>Tooltip anchor</Button>,
	text: 'tooltip text',
};

const waitForTooltipToShow = ( timeout = TOOLTIP_DELAY ) =>
	waitFor(
		() =>
			expect(
				screen.getByRole( 'tooltip', { name: 'tooltip text' } )
			).toBeVisible(),
		{ timeout }
	);

const waitForTooltipToHide = () =>
	waitFor( () =>
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument()
	);

const hoverOutside = async () => {
	await hover( document.body );
	await hover( document.body, { clientX: 10, clientY: 10 } );
};

describe( 'Tooltip', () => {
	it( 'should not render the tooltip if multiple children are passed', async () => {
		render(
			// expected TS error since Tooltip cannot have more than one child element
			// @ts-expect-error
			<Tooltip { ...props }>
				<Button>First button</Button>
				<Button>Second button</Button>
			</Tooltip>
		);

		expect(
			screen.getByRole( 'button', { name: 'First button' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Second button' } )
		).toBeVisible();

		await press.Tab();

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

	it( 'should show the tooltip when focusing on the tooltip anchor and hide it the anchor loses focus', async () => {
		render(
			<>
				<Tooltip { ...props } />
				<button>Focus me</button>
			</>
		);

		// Focus the anchor, tooltip should show
		await press.Tab();
		expect(
			screen.getByRole( 'button', { name: 'Tooltip anchor' } )
		).toHaveFocus();
		await waitForTooltipToShow();

		// Focus the other button, tooltip should hide
		await press.Tab();
		expect(
			screen.getByRole( 'button', { name: 'Focus me' } )
		).toHaveFocus();
		await waitForTooltipToHide();
	} );

	it( 'should render the tooltip when the tooltip anchor is hovered', async () => {
		render( <Tooltip { ...props } /> );

		await hover( screen.getByRole( 'button', { name: 'Tooltip anchor' } ) );

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();
	} );

	it( 'should not show tooltip on focus as result of mouse click', async () => {
		render( <Tooltip { ...props } /> );

		await click( screen.getByRole( 'button', { name: 'Tooltip anchor' } ) );

		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();
	} );

	it( 'should respect custom delay prop when showing tooltip', async () => {
		const ADDITIONAL_DELAY = 100;

		render(
			<Tooltip { ...props } delay={ TOOLTIP_DELAY + ADDITIONAL_DELAY } />
		);

		await hover( screen.getByRole( 'button', { name: 'Tooltip anchor' } ) );

		// Advance time by default delay
		await sleep( TOOLTIP_DELAY );

		// Tooltip hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();

		// wait for additional delay for tooltip to appear
		await sleep( ADDITIONAL_DELAY );

		expect(
			screen.getByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();
	} );

	it( 'should show tooltip when an element is disabled', async () => {
		render(
			<Tooltip { ...props }>
				<Button aria-disabled>Button</Button>
			</Tooltip>
		);

		const button = screen.getByRole( 'button', { name: 'Tooltip anchor' } );

		expect( button ).toBeVisible();
		expect( button ).toHaveAttribute( 'aria-disabled' );

		await hover( button );

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();
	} );

	it( 'should not show tooltip if the mouse leaves the tooltip anchor before set delay', async () => {
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

		await hover(
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
		await sleep( MOUSE_LEAVE_DELAY );

		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();

		// Hover the other button, meaning that the mouse will leave the tooltip anchor
		await hover(
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
		await sleep( TOOLTIP_DELAY );

		// Tooltip won't show, since the mouse has left the tooltip anchor
		expect(
			screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the shortcut display text when a string is passed as the shortcut', async () => {
		render( <Tooltip { ...props } shortcut="shortcut text" /> );

		await hover( screen.getByRole( 'button', { name: 'Tooltip anchor' } ) );

		await waitFor( () =>
			expect( screen.getByText( 'shortcut text' ) ).toBeVisible()
		);
	} );

	it( 'should render the keyboard shortcut display text and aria-label when an object is passed as the shortcut', async () => {
		render(
			<Tooltip
				{ ...props }
				shortcut={ {
					display: '⇧⌘,',
					ariaLabel: shortcutAriaLabel.primaryShift( ',' ),
				} }
			/>
		);

		await hover( screen.getByRole( 'button', { name: 'Tooltip anchor' } ) );

		await waitFor( () =>
			expect( screen.getByText( '⇧⌘,' ) ).toBeVisible()
		);

		expect( screen.getByText( '⇧⌘,' ) ).toHaveAttribute(
			'aria-label',
			'Control + Shift + Comma'
		);
	} );

	it( 'esc should close modal even when tooltip is visible', async () => {
		const onRequestClose = jest.fn();
		render(
			<Modal onRequestClose={ onRequestClose }>
				<p>Modal content</p>
			</Modal>
		);

		expect(
			screen.queryByRole( 'tooltip', { name: /close/i } )
		).not.toBeInTheDocument();

		await hover(
			screen.getByRole( 'button', {
				name: /close/i,
			} )
		);

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /close/i } )
			).toBeVisible()
		);

		await press.Escape();

		expect( onRequestClose ).toHaveBeenCalled();
	} );

	it( 'should associate the tooltip text with its anchor via the accessible description when visible', async () => {
		render( <Tooltip { ...props } /> );

		await hover(
			screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} )
		);

		expect(
			await screen.findByRole( 'button', { description: 'tooltip text' } )
		).toBeInTheDocument();
	} );

	it( 'should not hide tooltip when the anchor is clicked if hideOnClick is false', async () => {
		render( <Tooltip { ...props } hideOnClick={ false } /> );

		const button = screen.getByRole( 'button', { name: 'Tooltip anchor' } );

		await hover( button );

		expect(
			await screen.findByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();

		await click( button );

		expect(
			screen.getByRole( 'tooltip', { name: 'tooltip text' } )
		).toBeVisible();
	} );
} );
