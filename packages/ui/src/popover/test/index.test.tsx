import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component, createRef, useState } from '@wordpress/element';
import * as Popover from '../index';

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

			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );
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
			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );

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

			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );

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

			await waitFor( () => {
				expect(
					screen.getByText( 'Popover content' )
				).toBeInTheDocument();
			} );

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

			await waitFor( () => {
				expect(
					screen.getByText( 'Controlled content' )
				).toBeInTheDocument();
			} );
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

			await waitFor( () => {
				expect(
					screen.getByText( 'Default open content' )
				).toBeInTheDocument();
			} );
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

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>My Title</Popover.Title>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				const title = screen.getByText( 'My Title' );
				expect( title.id ).toBeTruthy();
			} );
		} );

		it( 'should associate description with the popup via aria-describedby', async () => {
			const user = userEvent.setup();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Title>Title</Popover.Title>
						<Popover.Description>
							My Description
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				const description = screen.getByText( 'My Description' );
				expect( description.id ).toBeTruthy();
			} );
		} );
	} );

	describe( 'variant', () => {
		it( 'should not apply popup styles when variant is unstyled', async () => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();

			render(
				<Popover.Root>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup ref={ ref } variant="unstyled">
						<Popover.Title>Title</Popover.Title>
						Unstyled content
					</Popover.Popup>
				</Popover.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( ref.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( ref.current!.className ).toBe( '' );
		} );
	} );

	describe( 'inline', () => {
		it( 'should render without a portal when inline is true', async () => {
			const user = userEvent.setup();

			render(
				<div data-testid="inline-wrapper">
					<Popover.Root>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Popup inline>
							<Popover.Title>Title</Popover.Title>
							Inline content
						</Popover.Popup>
					</Popover.Root>
				</div>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect(
					screen.getByText( 'Inline content' )
				).toBeInTheDocument();
			} );

			const wrapper = screen.getByTestId( 'inline-wrapper' );
			expect( wrapper ).toContainElement(
				screen.getByText( 'Inline content' )
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

			await waitFor( () => {
				expect(
					screen.getByText( 'Portal content' )
				).toBeInTheDocument();
			} );

			const wrapper = screen.getByTestId( 'portal-wrapper' );
			expect( wrapper ).not.toContainElement(
				screen.getByText( 'Portal content' )
			);
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
							<Popover.Popup anchor={ anchorEl ?? undefined }>
								<Popover.Title>Title</Popover.Title>
								Anchored content
							</Popover.Popup>
						</Popover.Root>
					</>
				);
			}

			render( <AnchorTest /> );

			await waitFor( () => {
				expect(
					screen.getByText( 'Anchored content' )
				).toBeInTheDocument();
			} );
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

			const trigger = screen.getByRole( 'button', { name: 'Open' } );
			await user.click( trigger );

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', {
						name: 'Content Button',
					} )
				).toBeInTheDocument();
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

			await waitFor( () => {
				expect(
					screen.getByText( 'Content Button' )
				).toBeInTheDocument();
			} );

			expect( customFocus ).toHaveBeenCalled();
		} );
	} );

	describe( 'title validation', () => {
		it( 'should throw when Popover.Title is missing', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			// Suppress console.error from React error boundary
			const spy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render(
				<ErrorBoundary onError={ onError }>
					<Popover.Root>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Popup>No title here</Popover.Popup>
					</Popover.Root>
				</ErrorBoundary>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( onError ).toHaveBeenCalledWith(
					expect.objectContaining( {
						message: expect.stringContaining(
							'Missing <Popover.Title>'
						),
					} )
				);
			} );

			spy.mockRestore();
		} );

		it( 'should throw when Popover.Title is empty', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			const spy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render(
				<ErrorBoundary onError={ onError }>
					<Popover.Root>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Popup>
							<Popover.Title />
						</Popover.Popup>
					</Popover.Root>
				</ErrorBoundary>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( onError ).toHaveBeenCalledWith(
					expect.objectContaining( {
						message: expect.stringContaining( 'cannot be empty' ),
					} )
				);
			} );

			spy.mockRestore();
		} );

		it( 'should not throw when Popover.Title is present', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<ErrorBoundary onError={ onError }>
					<Popover.Root>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Popup>
							<Popover.Title>Valid Title</Popover.Title>
						</Popover.Popup>
					</Popover.Root>
				</ErrorBoundary>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( screen.getByText( 'Valid Title' ) ).toBeVisible();
			} );

			expect( onError ).not.toHaveBeenCalled();
		} );
	} );
} );

class ErrorBoundary extends Component<
	{ children: React.ReactNode; onError: ( error: Error ) => void },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch( error: Error ) {
		this.props.onError( error );
	}

	render() {
		if ( this.state.hasError ) {
			return null;
		}
		return this.props.children;
	}
}
