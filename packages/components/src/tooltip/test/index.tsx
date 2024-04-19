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
import Modal from '../../modal';
import Tooltip, { TOOLTIP_DELAY } from '..';

const props = {
	children: <button>Tooltip anchor</button>,
	text: 'tooltip text',
};

const expectTooltipToBeVisible = () =>
	expect(
		screen.getByRole( 'tooltip', { name: 'tooltip text' } )
	).toBeVisible();

const expectTooltipToBeHidden = () =>
	expect(
		screen.queryByRole( 'tooltip', { name: 'tooltip text' } )
	).not.toBeInTheDocument();

const waitExpectTooltipToShow = async ( timeout = TOOLTIP_DELAY ) =>
	await waitFor( expectTooltipToBeVisible, { timeout } );

const waitExpectTooltipToHide = async () =>
	await waitFor( expectTooltipToBeHidden );

const hoverOutside = async () => {
	await hover( document.body );
	await hover( document.body, { clientX: 10, clientY: 10 } );
};

describe( 'Tooltip', () => {
	describe( 'basic behavior', () => {
		it( 'should not render the tooltip if multiple children are passed', async () => {
			render(
				// @ts-expect-error Tooltip cannot have more than one child element
				<Tooltip { ...props }>
					<button>First button</button>
					<button>Second button</button>
				</Tooltip>
			);

			expect(
				screen.getByRole( 'button', { name: 'First button' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'button', { name: 'Second button' } )
			).toBeVisible();

			await sleep();
			await press.Tab();

			expectTooltipToBeHidden();
		} );

		it( 'should associate the tooltip text with its anchor via the accessible description when visible', async () => {
			render( <Tooltip { ...props } /> );

			// The anchor can not be found by querying for its description,
			// since that is present only when the tooltip is visible
			expect(
				screen.queryByRole( 'button', { description: 'tooltip text' } )
			).not.toBeInTheDocument();

			// Hover the anchor. The tooltip shows and its text is used to describe
			// the tooltip anchor
			await hover(
				screen.getByRole( 'button', {
					name: 'Tooltip anchor',
				} )
			);
			expect(
				await screen.findByRole( 'button', {
					description: 'tooltip text',
				} )
			).toBeInTheDocument();

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();
			expect(
				screen.queryByRole( 'button', { description: 'tooltip text' } )
			).not.toBeInTheDocument();
		} );

		it( 'should not leak Tooltip props to the tooltip anchor', () => {
			render(
				<Tooltip data-foo>
					<button>Anchor</button>
				</Tooltip>
			);
			expect(
				screen.getByRole( 'button', { name: 'Anchor' } )
			).not.toHaveAttribute( 'data-foo' );
		} );
	} );

	describe( 'keyboard focus', () => {
		it( 'should not render the tooltip if there is no focus', () => {
			render( <Tooltip { ...props } /> );

			expect(
				screen.getByRole( 'button', { name: 'Tooltip anchor' } )
			).toBeVisible();

			expectTooltipToBeHidden();
		} );

		it( 'should show the tooltip when focusing on the tooltip anchor and hide it the anchor loses focus', async () => {
			render(
				<>
					<Tooltip { ...props } />
					<button>Focus me</button>
				</>
			);

			// Focus the anchor, tooltip should show
			await sleep();
			await press.Tab();
			expect(
				screen.getByRole( 'button', { name: 'Tooltip anchor' } )
			).toHaveFocus();
			await waitExpectTooltipToShow();

			// Focus the other button, tooltip should hide
			await sleep();
			await press.Tab();
			expect(
				screen.getByRole( 'button', { name: 'Focus me' } )
			).toHaveFocus();
			await waitExpectTooltipToHide();
		} );

		it( 'should show tooltip when focussing a disabled (but focussable) anchor button', async () => {
			render(
				<>
					<Tooltip { ...props }>
						<button aria-disabled="true">Tooltip anchor</button>
					</Tooltip>
					<button>Focus me</button>
				</>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );

			expect( anchor ).toBeVisible();
			expect( anchor ).toHaveAttribute( 'aria-disabled', 'true' );

			// Focus anchor, tooltip should show
			await sleep();
			await press.Tab();
			expect( anchor ).toHaveFocus();
			await waitExpectTooltipToShow();

			// Focus another button, tooltip should hide
			await sleep();
			await press.Tab();
			expect(
				screen.getByRole( 'button', {
					name: 'Focus me',
				} )
			).toHaveFocus();
			await waitExpectTooltipToHide();
		} );
	} );

	describe( 'mouse hover', () => {
		it( 'should show the tooltip when the tooltip anchor is hovered and hide it when the cursor stops hovering the anchor', async () => {
			render( <Tooltip { ...props } /> );

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );

			expect( anchor ).toBeVisible();

			// Hover over the anchor, tooltip should show
			await hover( anchor );
			await waitExpectTooltipToShow();

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();
		} );

		it( 'should show tooltip when hovering over a disabled (but focussable) anchor button', async () => {
			render(
				<>
					<Tooltip { ...props }>
						<button aria-disabled="true">Tooltip anchor</button>
					</Tooltip>
					<button>Focus me</button>
				</>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );

			expect( anchor ).toBeVisible();
			expect( anchor ).toHaveAttribute( 'aria-disabled', 'true' );

			// Hover over the anchor, tooltip should show
			await hover( anchor );
			await waitExpectTooltipToShow();

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();
		} );
	} );

	describe( 'mouse click', () => {
		it( 'should hide tooltip when the tooltip anchor is clicked', async () => {
			render( <Tooltip { ...props } /> );

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );

			expect( anchor ).toBeVisible();

			// Hover over the anchor, tooltip should show
			await hover( anchor );
			await waitExpectTooltipToShow();

			// Click the anchor, tooltip should hide
			await click( anchor );
			await waitExpectTooltipToHide();
		} );

		it( 'should not hide tooltip when the tooltip anchor is clicked and the `hideOnClick` prop is `false', async () => {
			render(
				<>
					<Tooltip { ...props } hideOnClick={ false } />
					<button>Click me</button>
				</>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );

			expect( anchor ).toBeVisible();

			// Hover over the anchor, tooltip should show
			await hover( anchor );
			await waitExpectTooltipToShow();

			// Click the anchor, tooltip should not hide
			await click( anchor );
			await waitExpectTooltipToShow();

			// Click another button, tooltip should hide
			await click( screen.getByRole( 'button', { name: 'Click me' } ) );
			await waitExpectTooltipToHide();
		} );
	} );

	describe( 'delay', () => {
		it( 'should respect custom delay prop when showing tooltip', async () => {
			const ADDITIONAL_DELAY = 100;

			render(
				<Tooltip
					{ ...props }
					delay={ TOOLTIP_DELAY + ADDITIONAL_DELAY }
				/>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );
			expect( anchor ).toBeVisible();

			// Hover over the anchor
			await hover( anchor );
			expectTooltipToBeHidden();

			// Advance time by default delay
			await sleep( TOOLTIP_DELAY );

			// Tooltip hasn't appeared yet
			expectTooltipToBeHidden();

			// Wait for additional delay for tooltip to appear
			await sleep( ADDITIONAL_DELAY );
			await waitExpectTooltipToShow();

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();

			// Prevent this test from interfering with the next one.
			// "Tooltips appear instantly if another tooltip has just been hidden."
			// See: https://github.com/WordPress/gutenberg/pull/57345#discussion_r1435495655
			await sleep( 3000 );
		} );

		it( 'should not show tooltip if the mouse leaves the tooltip anchor before set delay', async () => {
			const onMouseEnterMock = jest.fn();
			const onMouseLeaveMock = jest.fn();
			const HOVER_OUTSIDE_ANTICIPATION = 200;

			render(
				<Tooltip { ...props }>
					<button
						onMouseEnter={ onMouseEnterMock }
						onMouseLeave={ onMouseLeaveMock }
					>
						Tooltip anchor
					</button>
				</Tooltip>
			);

			const anchor = screen.getByRole( 'button', {
				name: 'Tooltip anchor',
			} );
			expect( anchor ).toBeVisible();

			// Hover over the anchor, tooltip hasn't appeared yet
			await hover( anchor );
			expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );
			expectTooltipToBeHidden();

			// Advance time, tooltip hasn't appeared yet because TOOLTIP_DELAY time
			// hasn't passed yet
			await sleep( TOOLTIP_DELAY - HOVER_OUTSIDE_ANTICIPATION );
			expectTooltipToBeHidden();

			// Hover outside of the anchor, tooltip still hasn't appeared yet
			await hoverOutside();
			expectTooltipToBeHidden();

			expect( onMouseEnterMock ).toHaveBeenCalledTimes( 1 );
			expect( onMouseLeaveMock ).toHaveBeenCalledTimes( 1 );

			// Advance time again, so that we reach the full TOOLTIP_DELAY time
			await sleep( HOVER_OUTSIDE_ANTICIPATION );

			// Tooltip won't show, since the mouse has left the tooltip anchor
			expectTooltipToBeHidden();
		} );
	} );

	describe( 'shortcut', () => {
		it( 'should show the shortcut in the tooltip when a string is passed as the shortcut', async () => {
			render( <Tooltip { ...props } shortcut="shortcut text" /> );

			// Hover over the anchor, tooltip should show
			await hover(
				screen.getByRole( 'button', { name: 'Tooltip anchor' } )
			);
			await waitFor( () =>
				expect(
					screen.getByRole( 'tooltip', {
						name: 'tooltip text shortcut text',
					} )
				).toBeVisible()
			);

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();
		} );

		it( 'should show the shortcut in the tooltip when an object is passed as the shortcut', async () => {
			render(
				<Tooltip
					{ ...props }
					shortcut={ {
						display: '⇧⌘,',
						ariaLabel: shortcutAriaLabel.primaryShift( ',' ),
					} }
				/>
			);

			// Hover over the anchor, tooltip should show
			await hover(
				screen.getByRole( 'button', { name: 'Tooltip anchor' } )
			);
			await waitFor( () =>
				expect(
					screen.getByRole( 'tooltip', {
						name: 'tooltip text Control + Shift + Comma',
					} )
				).toBeVisible()
			);
			expect(
				screen.getByRole( 'tooltip', {
					name: 'tooltip text Control + Shift + Comma',
				} )
			).toHaveTextContent( /⇧⌘,/i );

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();
		} );
	} );

	describe( 'event propagation', () => {
		it( 'should close the parent dialog component when pressing the Escape key while the tooltip is visible', async () => {
			const onRequestClose = jest.fn();
			render(
				<Modal onRequestClose={ onRequestClose }>
					<p>Modal content</p>
				</Modal>
			);

			expectTooltipToBeHidden();

			const closeButton = screen.getByRole( 'button', {
				name: /close/i,
			} );

			// Hover over the anchor, tooltip should show
			await hover( closeButton );
			await waitFor( () =>
				expect(
					screen.getByRole( 'tooltip', { name: /close/i } )
				).toBeVisible()
			);

			// Press the Escape key, Modal should request to be closed
			await press.Escape();
			expect( onRequestClose ).toHaveBeenCalled();

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitExpectTooltipToHide();
		} );
	} );

	describe( 'nested', () => {
		it( 'should render the outer tooltip and ignore nested tooltips', async () => {
			render(
				<Tooltip text="Outer tooltip">
					<Tooltip text="Middle tooltip">
						<Tooltip text="Inner tooltip">
							<button>Tooltip anchor</button>
						</Tooltip>
					</Tooltip>
				</Tooltip>
			);

			// Hover the anchor. Only the outer tooltip should show.
			await hover(
				screen.getByRole( 'button', {
					name: 'Tooltip anchor',
				} )
			);

			await waitFor( () =>
				expect(
					screen.getByRole( 'tooltip', { name: 'Outer tooltip' } )
				).toBeVisible()
			);
			expect(
				screen.queryByRole( 'tooltip', { name: 'Middle tooltip' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'tooltip', { name: 'Inner tooltip' } )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'button', {
					description: 'Outer tooltip',
				} )
			).toBeVisible();

			// Hover outside of the anchor, tooltip should hide
			await hoverOutside();
			await waitFor( () =>
				expect(
					screen.queryByRole( 'tooltip', { name: 'Outer tooltip' } )
				).not.toBeInTheDocument()
			);
		} );

		it( 'should not leak Tooltip component classname to the anchor element', () => {
			render(
				<Tooltip>
					<Tooltip>
						<button>Anchor</button>
					</Tooltip>
				</Tooltip>
			);
			expect(
				screen.getByRole( 'button', { name: 'Anchor' } )
			).not.toHaveClass( 'components-tooltip' );
		} );
	} );
} );
