import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import * as Popover from '../index';

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

describe( 'Popover', () => {
	describe( 'forwards ref', () => {
		it( 'should forward ref on Trigger', () => {
			const ref = createRef< HTMLButtonElement >();
			render(
				<Popover.Root>
					<Popover.Trigger ref={ ref }>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
		} );

		it( 'should forward ref on Popup', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup ref={ ref }>
						<Popover.Title>Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLDivElement );
			} );
		} );

		it( 'should forward ref on Arrow', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						<Popover.Arrow ref={ ref } />
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLDivElement );
			} );
		} );

		it( 'should forward ref on Title', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLHeadingElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title ref={ ref }>Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLHeadingElement );
			} );
		} );

		it( 'should forward ref on Description', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLParagraphElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						<Popover.Description ref={ ref }>
							Description
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLParagraphElement );
			} );
		} );

		it( 'should forward ref on Close', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLButtonElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						<Popover.Close ref={ ref }>Close</Popover.Close>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
			} );
		} );
	} );

	describe( 'open and close behavior', () => {
		it( 'should open the popover when the trigger is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						Popover content
					</Popover.Popup>
				</Popover.Root>
			);

			expect(
				screen.queryByText( 'Popover content' )
			).not.toBeInTheDocument();

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			expect(
				await screen.findByText( 'Popover content' )
			).toBeVisible();
		} );

		it( 'should close the popover when clicking the trigger again', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Toggle</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						Popover content
					</Popover.Popup>
				</Popover.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Toggle',
			} );

			await user.click( trigger );
			expect(
				await screen.findByText( 'Popover content' )
			).toBeVisible();

			await user.click( trigger );
			await waitFor( () => {
				expect(
					screen.queryByText( 'Popover content' )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'should close the popover when Escape is pressed', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						Popover content
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			expect(
				await screen.findByText( 'Popover content' )
			).toBeVisible();

			await user.keyboard( '{Escape}' );

			await waitFor( () => {
				expect(
					screen.queryByText( 'Popover content' )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'should close the popover when the Close button is clicked', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						Popover content
						<Popover.Close>Close</Popover.Close>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			expect(
				await screen.findByText( 'Popover content' )
			).toBeVisible();

			await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

			await waitFor( () => {
				expect(
					screen.queryByText( 'Popover content' )
				).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'controlled mode', () => {
		function ControlledPopover() {
			const [ open, setOpen ] = useState( false );
			return (
				<>
					<button onClick={ () => setOpen( true ) }>
						External open
					</button>
					<Popover.Root open={ open } onOpenChange={ setOpen }>
						<Popover.Trigger>Trigger</Popover.Trigger>
						<Popover.Popup>
							<Popover.Title>Title</Popover.Title>
							Controlled content
						</Popover.Popup>
					</Popover.Root>
				</>
			);
		}

		it( 'should open via external state', async () => {
			const user = userEvent.setup();

			render( <ControlledPopover /> );

			expect(
				screen.queryByText( 'Controlled content' )
			).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', { name: 'External open' } )
			);

			expect(
				await screen.findByText( 'Controlled content' )
			).toBeVisible();
		} );
	} );

	describe( 'defaultOpen', () => {
		it( 'should render open initially when defaultOpen is true', async () => {
			render(
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						Default open content
					</Popover.Popup>
				</Popover.Root>
			);

			expect(
				await screen.findByText( 'Default open content' )
			).toBeVisible();
		} );
	} );

	describe( 'onOpenChange callback', () => {
		it( 'should call onOpenChange when the popover opens and closes', async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();

			render(
				<Popover.Root onOpenChange={ onOpenChange }>
					<Popover.Trigger>Toggle</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					true,
					expect.anything()
				);
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle' } )
			);

			await waitFor( () => {
				expect( onOpenChange ).toHaveBeenCalledWith(
					false,
					expect.anything()
				);
			} );
		} );
	} );

	describe( 'accessibility', () => {
		it( 'should associate title with the popup via aria-labelledby', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup ref={ ref }>
						<Popover.Title>My Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toHaveAccessibleName( 'My Title' );
			} );
		} );

		it( 'should associate description with the popup via aria-describedby', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup ref={ ref }>
						<Popover.Title>Title</Popover.Title>
						<Popover.Description>
							My Description
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toHaveAccessibleDescription(
					'My Description'
				);
			} );
		} );

		it( 'merges user `className` on Popover.Title with the internal one', async () => {
			// Regression test for the shared `useRender` class-name merge
			// that also covers Popover.Description and its Dialog/Drawer
			// counterparts.
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title className="custom-title">
							Title
						</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const heading = await screen.findByRole( 'heading', {
				name: 'Title',
			} );
			// The regression this guards against: `useRender` must still
			// forward the user-supplied className to the underlying DOM node.
			// CSS module classes are stubbed in the Jest environment, so we
			// can only assert the user class end-to-end.
			expect( heading ).toHaveClass( 'custom-title' );
		} );
	} );

	describe( 'variant', () => {
		it( 'should not apply popup styles when variant is unstyled', async () => {
			const user = userEvent.setup();
			const unstyledRef = createRef< HTMLDivElement >();

			render(
				<>
					<Popover.Root>
						<Popover.Trigger>Open unstyled</Popover.Trigger>
						<Popover.Popup ref={ unstyledRef } variant="unstyled">
							<Popover.Title>Title</Popover.Title>
							Unstyled content
						</Popover.Popup>
					</Popover.Root>
					<Popover.Root>
						<Popover.Trigger>Open styled</Popover.Trigger>
						<Popover.Popup data-testid="styled-popup">
							<Popover.Title>Title</Popover.Title>
							Styled content
						</Popover.Popup>
					</Popover.Root>
				</>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open unstyled' } )
			);
			expect(
				await screen.findByText( 'Unstyled content' )
			).toBeVisible();
			const unstyledPopup = unstyledRef.current;
			expect( unstyledPopup ).not.toBeNull();

			await user.click(
				screen.getByRole( 'button', { name: 'Open styled' } )
			);
			const styledPopup = await screen.findByTestId( 'styled-popup' );

			const styledClasses = Array.from( styledPopup.classList );
			for ( const cls of styledClasses ) {
				expect( unstyledPopup! ).not.toHaveClass( cls );
			}
		} );
	} );

	describe( 'inline via portal (custom container)', () => {
		function InlinePopover() {
			const containerRef = createRef< HTMLSpanElement >();
			return (
				<div data-testid="inline-wrapper">
					<Popover.Root>
						<Popover.Trigger>Open</Popover.Trigger>
						<span
							ref={ containerRef }
							style={ { display: 'contents' } }
						/>
						<Popover.Popup
							portal={
								<Popover.Portal container={ containerRef } />
							}
						>
							<Popover.Title>Title</Popover.Title>
							Inline content
						</Popover.Popup>
					</Popover.Root>
				</div>
			);
		}

		it( 'should render inside the portal container when a local ref is used', async () => {
			const user = userEvent.setup();

			render( <InlinePopover /> );

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const content = await screen.findByText( 'Inline content' );
			expect( content ).toBeVisible();

			expect( screen.getByTestId( 'inline-wrapper' ) ).toContainElement(
				content
			);
		} );

		it( 'should render with a portal by default', async () => {
			const user = userEvent.setup();

			render(
				<div data-testid="portal-wrapper">
					<Popover.Root>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Popup>
							<Popover.Title>Title</Popover.Title>
							Portal content
						</Popover.Popup>
					</Popover.Root>
				</div>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const content = await screen.findByText( 'Portal content' );
			expect( content ).toBeVisible();

			expect(
				screen.getByTestId( 'portal-wrapper' )
			).not.toContainElement( content );
		} );
	} );

	describe( 'positioner', () => {
		it( 'should render the custom positioner element wrapping the popup content', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup
						positioner={
							<Popover.Positioner data-testid="custom-positioner" />
						}
					>
						<Popover.Title>Title</Popover.Title>
						Positioner slot content
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const content = await screen.findByText(
				'Positioner slot content'
			);
			const positioner = screen.getByTestId( 'custom-positioner' );

			expect( positioner ).toContainElement( content );
		} );
	} );

	describe( 'anchor', () => {
		it( 'should render the popup when an anchor element is provided without a trigger', async () => {
			function AnchorTest() {
				const [ anchorEl, setAnchorEl ] =
					useState< HTMLDivElement | null >( null );
				return (
					<>
						<div ref={ setAnchorEl } data-testid="anchor">
							Anchor element
						</div>
						<Popover.Root defaultOpen>
							<Popover.Popup
								positioner={
									<Popover.Positioner
										anchor={ anchorEl ?? undefined }
									/>
								}
							>
								<Popover.Title>Title</Popover.Title>
								Anchored content
							</Popover.Popup>
						</Popover.Root>
					</>
				);
			}

			render( <AnchorTest /> );

			expect(
				await screen.findByText( 'Anchored content' )
			).toBeVisible();
		} );
	} );

	describe( 'initialFocus', () => {
		it( 'should focus the first content element, skipping the close button', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						<Popover.Close>Close</Popover.Close>
						<button>Content Button</button>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', {
						name: 'Content Button',
					} )
				).toHaveFocus();
			} );
		} );

		it( 'should fall back to the close button when it is the only tabbable element', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						<Popover.Close>Close</Popover.Close>
						<p>No tabbable content here</p>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: 'Close' } )
				).toHaveFocus();
			} );
		} );

		it( 'should not move focus when initialFocus is false', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup initialFocus={ false }>
						<Popover.Title>Title</Popover.Title>
						<Popover.Close>Close</Popover.Close>
						<button>Content Button</button>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			const contentButton = await screen.findByRole( 'button', {
				name: 'Content Button',
			} );
			expect( contentButton ).toBeVisible();
			expect( contentButton ).not.toHaveFocus();
			expect(
				screen.getByRole( 'button', { name: 'Close' } )
			).not.toHaveFocus();
		} );

		it( 'should use a custom initialFocus callback as-is', async () => {
			const user = userEvent.setup();
			const customFocus = jest.fn( () => false as const );

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup initialFocus={ customFocus }>
						<Popover.Title>Title</Popover.Title>
						<Popover.Close>Close</Popover.Close>
						<button>Content Button</button>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			expect(
				await screen.findByRole( 'button', {
					name: 'Content Button',
				} )
			).toBeVisible();

			expect( customFocus ).toHaveBeenCalled();
		} );
	} );

	describe( 'title validation', () => {
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

		it( 'should throw when Popover.Title is missing', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>No title here</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Popover: Missing <Popover.Title>. ' +
					'For accessibility, every popover requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should throw when Popover.Title is empty', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title />
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Popover: <Popover.Title> cannot be empty. ' +
					'Provide meaningful text content for the popover title.'
			);

			cleanup();
		} );

		it( 'should not throw when Popover.Title is present', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Valid Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( screen.getByText( 'Valid Title' ) ).toBeVisible();
			} );

			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should throw when title is removed after mount', async () => {
			const { errors, cleanup } = collectUncaughtErrors();

			const ui = ( showTitle: boolean ) => (
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						{ showTitle && <Popover.Title>My Title</Popover.Title> }
						<p>Content</p>
					</Popover.Popup>
				</Popover.Root>
			);

			const { rerender } = render( ui( true ) );

			// Wait for the popover to render.
			await waitFor( () => {
				expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
			} );

			// Let initial validation settle — no errors expected.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			// Remove the title via rerender.
			rerender( ui( false ) );

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Popover: Missing <Popover.Title>. ' +
					'For accessibility, every popover requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should recover when title is added back', async () => {
			const { errors, cleanup } = collectUncaughtErrors();

			const ui = ( showTitle: boolean ) => (
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						{ showTitle && <Popover.Title>My Title</Popover.Title> }
						<p>Content</p>
					</Popover.Popup>
				</Popover.Root>
			);

			const { rerender } = render( ui( false ) );

			// Wait for the popover to render.
			await waitFor( () => {
				expect( screen.getByText( 'Content' ) ).toBeInTheDocument();
			} );

			// Initially no title — should error.
			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			const errorCountAfterInitial = errors.length;

			// Add the title back via rerender.
			rerender( ui( true ) );

			// Wait for deferred validation to settle.
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);

			// No new errors should have been thrown.
			expect( errors ).toHaveLength( errorCountAfterInitial );

			cleanup();
		} );
	} );
} );
