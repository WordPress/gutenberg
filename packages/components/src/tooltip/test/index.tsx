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

const props = {
	children: <Button>Button</Button>,
	text: 'tooltip text',
	delay: TOOLTIP_DELAY,
};

describe( 'Tooltip', () => {
	// TODO: may need to be tested with Playwright; further context:
	// https://github.com/WordPress/gutenberg/pull/52133#issuecomment-1613691258
	// below workaround ensures tooltip is umounted after each test to prevent leaking
	// similarly to ariakit tooltip tests: https://github.com/ariakit/ariakit/blob/249d376e41115e6d4ceba244e231a95fa457bd04/examples/tooltip/test.ts#L12-L14
	afterEach( async () => {
		const user = userEvent.setup();
		await user.tab();
		await user.tab();
		await user.click( document.body );
	} );

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
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render the tooltip if there is no focus', () => {
		render( <Tooltip { ...props } /> );

		expect(
			screen.getByRole( 'button', { name: /Button/i } )
		).toBeVisible();

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the tooltip when focusing on the tooltip anchor via tab', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		await user.tab();

		expect(
			screen.getByRole( 'button', { name: /Button/i } )
		).toHaveFocus();

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);
	} );

	it( 'should render the tooltip when the tooltip anchor is hovered', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);
	} );

	it( 'should not show tooltip on focus as result of mouse click', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } /> );

		await user.click( screen.getByRole( 'button', { name: /Button/i } ) );

		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should respect custom delay prop when showing tooltip', async () => {
		const user = userEvent.setup( { delay: TOOLTIP_DELAY } );
		const CUSTOM_DELAY = TOOLTIP_DELAY + 25;

		render( <Tooltip { ...props } delay={ CUSTOM_DELAY } /> );

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
	} );

	it( 'should show tooltip when an element is disabled', async () => {
		const user = userEvent.setup();

		render(
			<Tooltip { ...props }>
				<Button aria-disabled>Button</Button>
			</Tooltip>
		);

		const button = screen.getByRole( 'button', { name: /Button/i } );

		expect( button ).toBeVisible();
		expect( button ).toHaveAttribute( 'aria-disabled' );

		await user.hover( button );

		await waitFor( () =>
			expect(
				screen.getByRole( 'tooltip', { name: /tooltip text/i } )
			).toBeVisible()
		);
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
						Button 1
					</Button>
				</Tooltip>
				<Button>Button 2</Button>
			</>
		);

		await user.hover(
			screen.getByRole( 'button', {
				name: 'Button 1',
			} )
		);

		// Tooltip hasn't appeared yet
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

		// Tooltip still hasn't appeared yet
		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
		expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );
		expect( onMouseLeaveMock ).toHaveBeenCalledTimes( 1 );

		// Advance time again, so that we reach the full TOOLTIP_DELAY time
		await new Promise( ( resolve ) =>
			setTimeout( resolve, TOOLTIP_DELAY )
		);

		// Tooltip won't show, since the mouse has left the tooltip anchor
		expect(
			screen.queryByRole( 'tooltip', { name: /tooltip text/i } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the shortcut display text when a string is passed as the shortcut', async () => {
		const user = userEvent.setup();

		render( <Tooltip { ...props } shortcut="shortcut text" /> );

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		await waitFor( () =>
			expect( screen.getByText( 'shortcut text' ) ).toBeVisible()
		);
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

		const button = screen.getByRole( 'button', { name: /Button/i } );

		await user.hover( button );

		await waitFor( () =>
			expect( screen.getByText( '⇧⌘,' ) ).toBeVisible()
		);

		expect( screen.getByText( '⇧⌘,' ) ).toHaveAttribute(
			'aria-label',
			'Control + Shift + Comma'
		);
	} );

	it( 'esc should close modal even when tooltip is visible', async () => {
		const user = userEvent.setup();
		const onRequestClose = jest.fn();
		render(
			<Modal onRequestClose={ onRequestClose }>
				<p>Modal content</p>
			</Modal>
		);

		const tooltip = await screen.findByRole( 'tooltip', { hidden: true } );

		expect( tooltip ).toBeInTheDocument();

		const button = screen.getByRole( 'button', {
			name: /Close/i,
		} );

		await user.hover( button );

		await waitFor( () => expect( tooltip ).toBeVisible() );

		await user.keyboard( '[Escape]' );

		expect( onRequestClose ).toHaveBeenCalled();
	} );
} );
