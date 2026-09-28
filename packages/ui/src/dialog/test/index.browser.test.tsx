import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { createRef } from '@wordpress/element';
import * as Dialog from '../index';
import { ThemeProvider } from '../../utils/theme-provider';

describe( 'Dialog', () => {
	it( 'forwards ref', async () => {
		const user = userEvent;
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const actionRef = createRef< HTMLButtonElement >();
		const headerRef = createRef< HTMLElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const descriptionRef = createRef< HTMLParagraphElement >();
		const closeIconRef = createRef< HTMLButtonElement >();
		const footerRef = createRef< HTMLElement >();
		const contentRef = createRef< HTMLDivElement >();

		await render(
			<Dialog.Root>
				<Dialog.Trigger ref={ triggerRef }>Open Dialog</Dialog.Trigger>
				<Dialog.Popup ref={ popupRef }>
					<Dialog.Header ref={ headerRef }>
						<Dialog.Title ref={ titleRef }>
							Test Dialog
						</Dialog.Title>
						<Dialog.CloseIcon ref={ closeIconRef } />
					</Dialog.Header>
					<Dialog.Content ref={ contentRef }>
						<Dialog.Description ref={ descriptionRef }>
							A test description
						</Dialog.Description>
					</Dialog.Content>
					<Dialog.Footer ref={ footerRef }>
						<Dialog.Action ref={ actionRef }>Close</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		// Test trigger ref before interaction
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		// Click trigger to open dialog
		await user.click( triggerRef.current! );

		// Wait for the dialog to appear
		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		// Now that the dialog is open, verify all inner refs
		expect( headerRef.current ).toBeInstanceOf( HTMLElement );
		expect( headerRef.current?.tagName ).toBe( 'HEADER' );
		expect( titleRef.current ).toBeInstanceOf( HTMLHeadingElement );
		expect( descriptionRef.current ).toBeInstanceOf( HTMLParagraphElement );
		expect( closeIconRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( actionRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( footerRef.current ).toBeInstanceOf( HTMLElement );
		expect( footerRef.current?.tagName ).toBe( 'FOOTER' );
		expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'merges user `className` on Dialog.Title with the internal one', async () => {
		// Regression test for the shared `useRender` class-name merge
		// that also covers Popover.Title, Dialog.Description and
		// Popover.Description.
		const user = userEvent;

		await render(
			<Dialog.Root>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Title className="custom-title">Title</Dialog.Title>
				</Dialog.Popup>
			</Dialog.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

		const heading = await screen.findByRole( 'heading', { name: 'Title' } );
		// The regression this guards against: `useRender` must still forward
		// the user-supplied className to the underlying DOM node. CSS module
		// classes are stubbed in the Jest environment, so we can only assert
		// the user class end-to-end.
		expect( heading ).toHaveClass( 'custom-title' );
	} );

	it( 'associates Dialog.Description with the popup via aria-describedby', async () => {
		const user = userEvent;
		const popupRef = createRef< HTMLDivElement >();

		await render(
			<Dialog.Root>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Popup ref={ popupRef }>
					<Dialog.Title>Title</Dialog.Title>
					<Dialog.Description>My description</Dialog.Description>
				</Dialog.Popup>
			</Dialog.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

		await waitFor( () => {
			expect( popupRef.current ).toHaveAccessibleDescription(
				'My description'
			);
		} );
	} );

	it( 'renders Dialog.Footer and supports render/className props', async () => {
		const user = userEvent;

		await render(
			<Dialog.Root>
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Title>Test Dialog</Dialog.Title>
					<Dialog.Footer
						render={ <section data-testid="dialog-footer" /> }
						className="custom-footer"
					>
						<Dialog.Action>Close</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Dialog' } )
		);

		const footer = await screen.findByTestId( 'dialog-footer' );
		expect( footer.tagName ).toBe( 'SECTION' );
		expect( footer ).toHaveClass( 'custom-footer' );
		expect(
			screen.getByRole( 'button', { name: 'Close' } )
		).toBeInTheDocument();
	} );

	describe( 'Initial focus', () => {
		it( 'should focus the first content element, skipping the close icon', async () => {
			const user = userEvent;

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
							<Dialog.CloseIcon />
						</Dialog.Header>
						<button>Content Button</button>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'Content Button' } )
				).toHaveFocus();
			} );
		} );

		it( 'should fall back to the close icon when it is the only tabbable element', async () => {
			const user = userEvent;

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
							<Dialog.CloseIcon />
						</Dialog.Header>
						<p>No tabbable content here</p>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'Close' } )
				).toHaveFocus();
			} );
		} );

		it( 'should not move focus when initialFocus is false', async () => {
			const user = userEvent;

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup initialFocus={ false }>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
							<Dialog.CloseIcon />
						</Dialog.Header>
						<button>Content Button</button>
					</Dialog.Popup>
				</Dialog.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Open Dialog',
			} );
			await user.click( trigger );

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			expect(
				screen.getByRole( 'button', { name: 'Content Button' } )
			).not.toHaveFocus();
			expect(
				screen.getByRole( 'button', { name: 'Close' } )
			).not.toHaveFocus();
		} );

		it( 'should use a custom initialFocus callback as-is', async () => {
			const user = userEvent;
			const customFocus = vi.fn( () => false as const );

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup initialFocus={ customFocus }>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
							<Dialog.CloseIcon />
						</Dialog.Header>
						<button>Content Button</button>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			expect( customFocus ).toHaveBeenCalled();
		} );
	} );

	describe( 'portal', () => {
		it( 'uses the root theme when portaled from a nested theme', async () => {
			const user = userEvent;
			const popupRef = createRef< HTMLDivElement >();

			await render(
				<ThemeProvider isRoot cornerRadius="subtle">
					<ThemeProvider cornerRadius="pronounced">
						<Dialog.Root>
							<Dialog.Trigger>Open</Dialog.Trigger>
							<Dialog.Popup ref={ popupRef }>
								<Dialog.Title>Title</Dialog.Title>
							</Dialog.Popup>
						</Dialog.Root>
					</ThemeProvider>
				</ThemeProvider>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			// The popup is portaled next to the app root, so its closest theme
			// boundary should be the root provider mirrored onto the document.
			/* eslint-disable testing-library/no-node-access */
			expect(
				popupRef.current?.closest( '[data-wpds-corner-radius]' )
			).toBe( document.documentElement );
			/* eslint-enable testing-library/no-node-access */
		} );

		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent;
			const containerRef = createRef< HTMLDivElement >();

			await render(
				<div data-testid="wrapper">
					<Dialog.Root>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<div
							ref={ containerRef }
							data-testid="custom-container"
						/>
						<Dialog.Popup
							portal={
								<Dialog.Portal container={ containerRef } />
							}
						>
							<Dialog.Header>
								<Dialog.Title>Title</Dialog.Title>
							</Dialog.Header>
							Dialog content
						</Dialog.Popup>
					</Dialog.Root>
				</div>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const content = await screen.findByText( 'Dialog content' );
			await expect.element( content ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				content
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent;

			await render(
				<div data-testid="wrapper">
					<Dialog.Root>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<Dialog.Popup>
							<Dialog.Header>
								<Dialog.Title>Title</Dialog.Title>
							</Dialog.Header>
							Portal content
						</Dialog.Popup>
					</Dialog.Root>
				</div>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const content = await screen.findByText( 'Portal content' );
			await expect.element( content ).toBeVisible();

			expect( screen.getByTestId( 'wrapper' ) ).not.toContainElement(
				content
			);
		} );
	} );

	describe( 'overlay scroll container', () => {
		it( 'marks Dialog.Content with data-wp-ui-overlay-scroll-container', async () => {
			const user = userEvent;
			const contentRef = createRef< HTMLDivElement >();

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Title>Title</Dialog.Title>
						<Dialog.Content ref={ contentRef }>
							<p>Body</p>
						</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( contentRef.current ).toHaveAttribute(
				'data-wp-ui-overlay-scroll-container'
			);
		} );

		it( 'sets data-wp-ui-overlay-modal on the popup when modal is true', async () => {
			const user = userEvent;
			const popupRef = createRef< HTMLDivElement >();

			await render(
				<Dialog.Root modal>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Popup ref={ popupRef }>
						<Dialog.Title>Title</Dialog.Title>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( popupRef.current ).toHaveAttribute(
				'data-wp-ui-overlay-modal'
			);
		} );

		it.each( [
			[ 'false', false as const ],
			[ 'trap-focus', 'trap-focus' as const ],
		] )(
			'omits data-wp-ui-overlay-modal on the popup when modal is %s',
			async ( _label, modal ) => {
				const user = userEvent;
				const popupRef = createRef< HTMLDivElement >();

				await render(
					<Dialog.Root modal={ modal }>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<Dialog.Popup ref={ popupRef }>
							<Dialog.Title>Title</Dialog.Title>
						</Dialog.Popup>
					</Dialog.Root>
				);

				await user.click(
					screen.getByRole( 'button', { name: 'Open' } )
				);
				await waitFor( () => {
					expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
				} );

				expect( popupRef.current ).not.toHaveAttribute(
					'data-wp-ui-overlay-modal'
				);
			}
		);

		it( 'pins Dialog.Header when rendered as a sibling of Dialog.Content', async () => {
			const user = userEvent;
			const popupRef = createRef< HTMLDivElement >();
			const headerRef = createRef< HTMLElement >();
			const contentRef = createRef< HTMLDivElement >();

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Popup ref={ popupRef }>
						<Dialog.Header ref={ headerRef }>
							<Dialog.Title>Title</Dialog.Title>
						</Dialog.Header>
						<Dialog.Content ref={ contentRef }>
							<p>Body</p>
						</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( headerRef.current ).toBeInstanceOf( HTMLElement );
			} );

			// The header is inside the popup but NOT inside the scroll
			// container — it sits outside the scrolling region as a
			// pinned flex sibling of `Content`.
			expect( popupRef.current ).toContainElement( headerRef.current );
			expect( popupRef.current ).toContainElement( contentRef.current );
			expect( contentRef.current ).not.toContainElement(
				headerRef.current
			);
			// And it sits *before* the scroll container — the CSS
			// sticky-separator selectors rely on that DOM order.
			const position = headerRef.current!.compareDocumentPosition(
				contentRef.current!
			);
			expect(
				// eslint-disable-next-line no-bitwise
				position & Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		} );

		it( 'scrolls Dialog.Header with the body when nested inside Dialog.Content', async () => {
			const user = userEvent;
			const headerRef = createRef< HTMLElement >();
			const contentRef = createRef< HTMLDivElement >();

			await render(
				<Dialog.Root>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Content ref={ contentRef }>
							<Dialog.Header ref={ headerRef }>
								<Dialog.Title>Title</Dialog.Title>
							</Dialog.Header>
							<p>Body</p>
						</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( headerRef.current ).toBeInstanceOf( HTMLElement );
			} );

			expect( contentRef.current ).toContainElement( headerRef.current );
		} );

		// This test exercises the `updateScrollAttributes` path for
		// consumer takeover (overflow flips off while the override is
		// in place). The matching `cleanupScrollAttributes` path —
		// popup unmounts while the override is in place — is covered
		// transitively because both paths share a single
		// `reconcileTabbableFlag` helper inside the hook. If that
		// shared helper is ever inlined or split, add an explicit
		// unmount-after-takeover test to keep both paths regressions-
		// guarded.
	} );
} );
