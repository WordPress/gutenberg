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
import Button from '../../../button';
import { ToolTip } from '..';
import { TOOLTIP_DELAY } from '../../../tooltip/';

const props = {
	children: <Button>Button</Button>,
	text: 'tooltip text',
	delay: TOOLTIP_DELAY,
};

describe( 'ToolTip', () => {
	it( 'should not render the tooltip if multiple children are passed', async () => {
		const user = userEvent.setup();

		render(
			// @ts-expect-error
			<ToolTip { ...props }>
				<Button>Button 1</Button>
				<Button>Button 2</Button>
			</ToolTip>
		);

		await user.tab();

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render the tooltip if there is no focus', () => {
		render( <ToolTip { ...props } /> );

		expect(
			screen.getByRole( 'button', { name: /Button/i } )
		).toBeVisible();

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the tooltip when focusing on the tooltip anchor via tab', async () => {
		const user = userEvent.setup();

		render( <ToolTip { ...props } /> );

		await user.tab();
		await user.tab();

		expect(
			screen.getByRole( 'button', { name: /Button/i } )
		).toHaveFocus();

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);

		await user.tab();

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		// Wait for the tooltip element to be positioned (aligned with the button)
		// await waitFor( () =>
		// 	expect(
		// 		getWrappingPopoverElement( screen.getByText( 'tooltip text' ) )
		// 	).toBePositionedPopover()
		// );
	} );

	it( 'should render the tooltip when the tooltip anchor is hovered', async () => {
		const user = userEvent.setup();

		render( <ToolTip { ...props } /> );

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);

		// Wait for the tooltip element to be positioned (aligned with the button)
		// await waitFor( () =>
		// 	expect(
		// 		getWrappingPopoverElement( screen.getByText( 'tooltip text' ) )
		// 	).toBePositionedPopover()
		// );

		await user.unhover( button );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should not show tooltip on focus as result of mouse click', async () => {
		const user = userEvent.setup();

		render( <ToolTip { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: /Button/i } ) );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should respect custom delay prop when showing tooltip', async () => {
		const user = userEvent.setup( { delay: TOOLTIP_DELAY } );
		const CUSTOM_DELAY = TOOLTIP_DELAY + 25;

		render( <ToolTip { ...props } delay={ CUSTOM_DELAY } /> );

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);

		await user.unhover( button );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		// Wait for the tooltip element to be positioned (aligned with the button)
		// await waitFor( () =>
		// 	expect(
		// 		getWrappingPopoverElement( screen.getByText( 'tooltip text' ) )
		// 	).toBePositionedPopover()
		// );
	} );

	it( 'should show tooltip when an element is disabled', async () => {
		const user = userEvent.setup();

		render(
			<ToolTip { ...props }>
				<Button disabled>Button</Button>
			</ToolTip>
		);

		const button = screen.getByRole( 'button', { name: /Button/i } );

		expect( button ).toBeVisible();
		expect( button ).toBeDisabled();

		await user.hover( button );

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);

		await user.unhover( button );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		// Wait for the tooltip element to be positioned (aligned with the button)
		// await waitFor( () =>
		// 	expect(
		// 		getWrappingPopoverElement( screen.getByText( 'tooltip text' ) )
		// 	).toBePositionedPopover()
		// );
	} );

	it( 'should not show tooltip if the mouse leaves the tooltip anchor before set delay', async () => {
		const user = userEvent.setup();
		const onMouseEnterMock = jest.fn();
		const onMouseLeaveMock = jest.fn();
		const MOUSE_LEAVE_DELAY = TOOLTIP_DELAY - 200;

		render(
			<>
				<ToolTip { ...props }>
					<Button
						onMouseEnter={ onMouseEnterMock }
						onMouseLeave={ onMouseLeaveMock }
					>
						Button 1
					</Button>
				</ToolTip>
				<Button>Button 2</Button>
			</>
		);

		await user.hover(
			screen.getByRole( 'button', {
				name: 'Button 1',
			} )
		);

		// ToolTip hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
		expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );

		// Advance time by MOUSE_LEAVE_DELAY time
		await new Promise( ( resolve ) =>
			setTimeout( resolve, MOUSE_LEAVE_DELAY )
		);

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		// Hover the other button, meaning that the mouse will leave the tooltip anchor
		await user.hover(
			screen.getByRole( 'button', {
				name: 'Button 2',
			} )
		);

		// ToolTip still hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
		expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );
		expect( onMouseLeaveMock ).toHaveBeenCalledTimes( 1 );

		// Advance time again, so that we reach the full TOOLTIP_DELAY time
		await new Promise( ( resolve ) =>
			setTimeout( resolve, TOOLTIP_DELAY )
		);

		// ToolTip won't show, since the mouse has left the tooltip anchor
		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the shortcut display text when a string is passed as the shortcut', async () => {
		const user = userEvent.setup();

		render( <ToolTip { ...props } shortcut="shortcut text" /> );

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		await waitFor( () =>
			expect( screen.getByText( 'shortcut text' ) ).toBeVisible()
		);

		await user.unhover( button );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		// Wait for the tooltip element to be positioned (aligned with the button)
		// await waitFor( () =>
		// 	expect(
		// 		getWrappingPopoverElement( screen.getByText( 'shortcut text' ) )
		// 	).toBePositionedPopover()
		// );
	} );

	it( 'should render the keyboard shortcut display text and aria-label when an object is passed as the shortcut', async () => {
		const user = userEvent.setup();

		render(
			<ToolTip
				{ ...props }
				shortcut={ {
					display: '⇧⌘,',
					ariaLabel: shortcutAriaLabel.primaryShift( ',' ),
				} }
			/>
		);

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		await waitFor( () =>
			expect( screen.getByText( '⇧⌘,' ) ).toBeVisible()
		);

		expect( screen.getByText( '⇧⌘,' ) ).toHaveAttribute(
			'aria-label',
			'Control + Shift + Comma'
		);

		await user.unhover( button );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();

		// Wait for the tooltip element to be positioned (aligned with the button)
		// await waitFor( () =>
		// 	expect(
		// 		getWrappingPopoverElement( screen.getByText( 'shortcut text' ) )
		// 	).toBePositionedPopover()
		// );
	} );
} );
