import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import * as Dialog from '../index';

function collectUncaughtErrors() {
	const errors: Error[] = [];
	const handler = ( event: ErrorEvent ) => {
		event.preventDefault();
		errors.push( event.error );
	};
	window.addEventListener( 'error', handler );
	return {
		errors,
		cleanup: () => window.removeEventListener( 'error', handler ),
	};
}

describe( 'Dialog', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const actionRef = createRef< HTMLButtonElement >();
		const headerRef = createRef< HTMLElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const descriptionRef = createRef< HTMLParagraphElement >();
		const closeIconRef = createRef< HTMLButtonElement >();
		const footerRef = createRef< HTMLElement >();
		const contentRef = createRef< HTMLDivElement >();

		render(
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
		const user = userEvent.setup();

		render(
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
		const user = userEvent.setup();
		const popupRef = createRef< HTMLDivElement >();

		render(
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
		const user = userEvent.setup();

		render(
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

	it( 'renders backdrop only when modal is true', async () => {
		const getBackdrops = () => screen.queryAllByTestId( 'dialog-backdrop' );

		const view = render(
			<Dialog.Root open modal>
				<Dialog.Popup>
					<Dialog.Title>Modal dialog</Dialog.Title>
				</Dialog.Popup>
			</Dialog.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getBackdrops() ).toHaveLength( 1 );

		view.rerender(
			<Dialog.Root open modal={ false }>
				<Dialog.Popup>
					<Dialog.Title>Non modal dialog</Dialog.Title>
				</Dialog.Popup>
			</Dialog.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getBackdrops() ).toHaveLength( 0 );

		view.rerender(
			<Dialog.Root open modal="trap-focus">
				<Dialog.Popup>
					<Dialog.Title>Trap focus dialog</Dialog.Title>
				</Dialog.Popup>
			</Dialog.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getBackdrops() ).toHaveLength( 0 );
	} );

	it( 'renders the popup across default and explicit size values', async () => {
		const view = render(
			<Dialog.Root open>
				<Dialog.Popup>
					<Dialog.Title>Default size dialog</Dialog.Title>
				</Dialog.Popup>
			</Dialog.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();

		for ( const size of [
			'small',
			'medium',
			'large',
			'stretch',
			'full',
		] as const ) {
			view.rerender(
				<Dialog.Root open>
					<Dialog.Popup size={ size }>
						<Dialog.Title>{ size } dialog</Dialog.Title>
					</Dialog.Popup>
				</Dialog.Root>
			);
			expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		}
	} );

	it( 'marks Dialog.Action as disabled when loading is true', async () => {
		render(
			<Dialog.Root open>
				<Dialog.Popup>
					<Dialog.Title>Action states</Dialog.Title>
					<Dialog.Footer>
						<Dialog.Action loading>Loading action</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		const action = await screen.findByRole( 'button', {
			name: 'Loading action',
		} );
		expect( action ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'marks Dialog.Action as disabled when disabled is true', async () => {
		render(
			<Dialog.Root open>
				<Dialog.Popup>
					<Dialog.Title>Action states</Dialog.Title>
					<Dialog.Footer>
						<Dialog.Action disabled>Disabled action</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		const action = await screen.findByRole( 'button', {
			name: 'Disabled action',
		} );
		expect( action ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'lets explicit disabled={ false } override loading on Dialog.Action', async () => {
		// `Dialog.Action` uses `disabled ?? loading`, so an explicit
		// `disabled={ false }` wins over an active loading state.
		render(
			<Dialog.Root open>
				<Dialog.Popup>
					<Dialog.Title>Action states</Dialog.Title>
					<Dialog.Footer>
						<Dialog.Action disabled={ false } loading>
							Explicit not-disabled
						</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
		);

		const action = await screen.findByRole( 'button', {
			name: 'Explicit not-disabled',
		} );
		expect( action ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	describe( 'Development mode validation', () => {
		// Suppress console.error from React act() warnings and jsdom
		// unhandled-error logging. Validation errors are caught via
		// collectUncaughtErrors (window 'error' event) instead.
		let originalConsoleError: typeof console.error;

		beforeEach( () => {
			// eslint-disable-next-line no-console
			originalConsoleError = console.error;
			// eslint-disable-next-line no-console
			console.error = jest.fn();
		} );

		afterEach( () => {
			// eslint-disable-next-line no-console
			console.error = originalConsoleError;
		} );

		it( 'should throw when Dialog.Title is missing', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							{ /* Missing Dialog.Title */ }
						</Dialog.Header>
						<p>Content without a title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Dialog: Missing <Dialog.Title>. ' +
					'For accessibility, every dialog requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should not throw before opening the dialog', async () => {
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
						</Dialog.Header>
						<p>Content with a title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await expect( screen.findByRole( 'dialog' ) ).rejects.toThrow();
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should not throw when Dialog.Title is present', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>My Title</Dialog.Title>
						</Dialog.Header>
						<p>Content with a title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			// Allow deferred validation to settle.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should throw when Dialog.Title is empty', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title />
						</Dialog.Header>
						<p>Content with empty title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Dialog: <Dialog.Title> cannot be empty. ' +
					'Provide meaningful text content for the dialog title.'
			);

			cleanup();
		} );

		it( 'should throw when Dialog.Title contains only whitespace', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title> </Dialog.Title>
						</Dialog.Header>
						<p>Content with whitespace-only title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Dialog: <Dialog.Title> cannot be empty. ' +
					'Provide meaningful text content for the dialog title.'
			);

			cleanup();
		} );

		it( 'should not throw when Dialog.Title contains mixed content with text', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open Dialog</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Header>
							<Dialog.Title>
								<span aria-hidden="true">🎉</span>
								Settings
							</Dialog.Title>
						</Dialog.Header>
						<p>Content with icon and text title</p>
						<Dialog.Footer>
							<Dialog.Action>Close</Dialog.Action>
						</Dialog.Footer>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Dialog' } )
			);

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should throw when title is removed after mount', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			function Test() {
				const [ showTitle, setShowTitle ] = useState( true );
				return (
					<Dialog.Root>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<Dialog.Popup>
							{ showTitle && (
								<Dialog.Title>My Title</Dialog.Title>
							) }
							<button onClick={ () => setShowTitle( false ) }>
								Remove Title
							</button>
						</Dialog.Popup>
					</Dialog.Root>
				);
			}

			render( <Test /> );

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			// Let initial validation settle — no errors expected.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			// Remove the title.
			await user.click(
				screen.getByRole( 'button', { name: 'Remove Title' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Dialog: Missing <Dialog.Title>. ' +
					'For accessibility, every dialog requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should recover when title is added back', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			function Test() {
				const [ showTitle, setShowTitle ] = useState( false );
				return (
					<Dialog.Root>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<Dialog.Popup>
							{ showTitle && (
								<Dialog.Title>My Title</Dialog.Title>
							) }
							<button
								onClick={ () => setShowTitle( ( s ) => ! s ) }
							>
								Toggle Title
							</button>
						</Dialog.Popup>
					</Dialog.Root>
				);
			}

			render( <Test /> );

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			// Initially no title — should error.
			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			const errorCountAfterInitial = errors.length;

			// Add the title back.
			await user.click(
				screen.getByRole( 'button', { name: 'Toggle Title' } )
			);

			// Wait for deferred validation to settle.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);

			// No new errors should have been thrown.
			expect( errors ).toHaveLength( errorCountAfterInitial );

			cleanup();
		} );
	} );

	describe( 'Initial focus', () => {
		it( 'should focus the first content element, skipping the close icon', async () => {
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();

			render(
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
			const user = userEvent.setup();
			const customFocus = jest.fn( () => false as const );

			render(
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
		it( 'should render inside the portal container when a custom target is provided', async () => {
			const user = userEvent.setup();
			const containerRef = createRef< HTMLDivElement >();

			render(
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
			expect( content ).toBeVisible();

			expect( screen.getByTestId( 'custom-container' ) ).toContainElement(
				content
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent.setup();

			render(
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
			expect( content ).toBeVisible();

			expect( screen.getByTestId( 'wrapper' ) ).not.toContainElement(
				content
			);
		} );
	} );

	describe( 'overlay scroll container', () => {
		it( 'marks Dialog.Content with data-wp-ui-overlay-scroll-container', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
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
			const user = userEvent.setup();
			const popupRef = createRef< HTMLDivElement >();

			render(
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
				const user = userEvent.setup();
				const popupRef = createRef< HTMLDivElement >();

				render(
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
			const user = userEvent.setup();
			const popupRef = createRef< HTMLDivElement >();
			const headerRef = createRef< HTMLElement >();
			const contentRef = createRef< HTMLDivElement >();

			render(
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
			const user = userEvent.setup();
			const headerRef = createRef< HTMLElement >();
			const contentRef = createRef< HTMLDivElement >();

			render(
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

		it( 'invokes a consumer-supplied onScroll on Dialog.Content', async () => {
			const user = userEvent.setup();
			const onScroll = jest.fn();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Dialog.Root>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Popup>
						<Dialog.Title>Title</Dialog.Title>
						<Dialog.Content
							ref={ contentRef }
							onScroll={ onScroll }
						>
							<p>Body</p>
						</Dialog.Content>
					</Dialog.Popup>
				</Dialog.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			act( () => {
				contentRef.current?.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( onScroll ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'toggles tabindex="0" on Dialog.Content based on overflow', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
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

			// JSDOM reports 0/0 dimensions by default, so the initial
			// mount sees no overflow and installs no tabindex. Stub
			// layout metrics, dispatch a scroll to re-run the update,
			// and verify the tabindex is installed.
			const content = contentRef.current!;
			Object.defineProperty( content, 'scrollHeight', {
				configurable: true,
				value: 500,
			} );
			Object.defineProperty( content, 'clientHeight', {
				configurable: true,
				value: 100,
			} );
			Object.defineProperty( content, 'scrollTop', {
				configurable: true,
				value: 0,
			} );

			act( () => {
				content.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( content ).toHaveAttribute( 'tabindex', '0' );

			// Shrink content so it no longer overflows and verify the
			// hook removes its managed tabindex.
			Object.defineProperty( content, 'scrollHeight', {
				configurable: true,
				value: 100,
			} );

			act( () => {
				content.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( content ).not.toHaveAttribute( 'tabindex' );
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
		it( 'preserves a consumer-supplied tabindex set after the hook installed its own', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
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

			const content = contentRef.current!;
			Object.defineProperty( content, 'scrollHeight', {
				configurable: true,
				value: 500,
			} );
			Object.defineProperty( content, 'clientHeight', {
				configurable: true,
				value: 100,
			} );
			Object.defineProperty( content, 'scrollTop', {
				configurable: true,
				value: 0,
			} );

			act( () => {
				content.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( content ).toHaveAttribute( 'tabindex', '0' );

			// Simulate the consumer taking over the tabindex after the
			// hook installed its own (e.g. a re-render with an explicit
			// `tabIndex={ -1 }` prop). The hook should detect the
			// consumer takeover and not clobber that value on the next
			// non-overflow tick.
			content.setAttribute( 'tabindex', '-1' );

			Object.defineProperty( content, 'scrollHeight', {
				configurable: true,
				value: 100,
			} );

			act( () => {
				content.dispatchEvent(
					new Event( 'scroll', { bubbles: true } )
				);
			} );

			expect( content ).toHaveAttribute( 'tabindex', '-1' );
		} );

		it( 'toggles data-wp-ui-overlay-scrolled-from-* based on scroll position', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
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

			// JSDOM doesn't lay out elements, so we simulate an
			// overflowing scroll container by stubbing layout metrics
			// per scenario and dispatching a scroll event.
			const content = contentRef.current!;
			Object.defineProperty( content, 'scrollHeight', {
				configurable: true,
				value: 500,
			} );
			Object.defineProperty( content, 'clientHeight', {
				configurable: true,
				value: 100,
			} );

			const setScrollTop = ( value: number ) => {
				Object.defineProperty( content, 'scrollTop', {
					configurable: true,
					value,
				} );
				act( () => {
					content.dispatchEvent(
						new Event( 'scroll', { bubbles: true } )
					);
				} );
			};

			// At the top: only "from-bottom" is set (content below).
			setScrollTop( 0 );
			expect( content ).not.toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);

			// In the middle: both are set.
			setScrollTop( 200 );
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);

			// At the bottom: only "from-top" is set (content above).
			setScrollTop( 400 );
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( content ).not.toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);
		} );
	} );
} );
