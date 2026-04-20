import { render, screen, waitFor } from '@testing-library/react';
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
		const headerRef = createRef< HTMLDivElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const closeIconRef = createRef< HTMLButtonElement >();
		const footerRef = createRef< HTMLDivElement >();

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
		expect( headerRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( titleRef.current ).toBeInstanceOf( HTMLHeadingElement );
		expect( closeIconRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( actionRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( footerRef.current ).toBeInstanceOf( HTMLDivElement );
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
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
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

			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
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
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
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
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );

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

	describe( 'container', () => {
		it( 'should render inside the container when provided', async () => {
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
						<Dialog.Popup container={ containerRef }>
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
} );
