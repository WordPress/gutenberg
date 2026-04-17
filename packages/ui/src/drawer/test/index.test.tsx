import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import * as Drawer from '../index';

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

describe( 'Drawer', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const actionRef = createRef< HTMLButtonElement >();
		const footerRef = createRef< HTMLDivElement >();
		const headerRef = createRef< HTMLDivElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const descriptionRef = createRef< HTMLParagraphElement >();
		const closeIconRef = createRef< HTMLButtonElement >();

		render(
			<Drawer.Root>
				<Drawer.Trigger ref={ triggerRef }>Open Drawer</Drawer.Trigger>
				<Drawer.Popup ref={ popupRef }>
					<Drawer.Header ref={ headerRef }>
						<Drawer.Title ref={ titleRef }>
							Test Drawer
						</Drawer.Title>
						<Drawer.CloseIcon ref={ closeIconRef } />
					</Drawer.Header>
					<Drawer.Description ref={ descriptionRef }>
						A test description
					</Drawer.Description>
					<Drawer.Footer ref={ footerRef }>
						<Drawer.Action ref={ actionRef }>Close</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);

		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		await user.click( triggerRef.current! );

		await waitFor( () => {
			expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		expect( headerRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( titleRef.current ).toBeInstanceOf( HTMLHeadingElement );
		expect( descriptionRef.current ).toBeInstanceOf( HTMLParagraphElement );
		expect( closeIconRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( footerRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( actionRef.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'renders Drawer.Footer and supports render/className props', async () => {
		const user = userEvent.setup();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Title>Test Drawer</Drawer.Title>
					<Drawer.Footer
						render={ <section data-testid="drawer-footer" /> }
						className="custom-footer"
					>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Drawer' } )
		);

		const footer = await screen.findByTestId( 'drawer-footer' );
		expect( footer.tagName ).toBe( 'SECTION' );
		expect( footer ).toHaveClass( 'custom-footer' );
		expect(
			screen.getByRole( 'button', { name: 'Close' } )
		).toBeInTheDocument();
	} );

	it( 'uses provided portal container', async () => {
		const user = userEvent.setup();
		const container = document.createElement( 'div' );
		container.setAttribute( 'data-testid', 'portal-container' );
		document.body.appendChild( container );

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup container={ container }>
					<Drawer.Title>In custom container</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Drawer' } )
		);

		const dialog = await screen.findByRole( 'dialog' );
		expect( container ).toContainElement( dialog );

		container.remove();
	} );

	it( 'renders backdrop only when modal is true', async () => {
		const view = render(
			<Drawer.Root open modal>
				<Drawer.Popup>
					<Drawer.Title>Modal drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect(
			screen
				.getAllByRole( 'presentation', { hidden: true } )
				.filter( ( element ) => element.hasAttribute( 'data-open' ) )
		).toHaveLength( 2 );

		view.rerender(
			<Drawer.Root open modal={ false }>
				<Drawer.Popup>
					<Drawer.Title>Non modal drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect(
			screen
				.getAllByRole( 'presentation', { hidden: true } )
				.filter( ( element ) => element.hasAttribute( 'data-open' ) )
		).toHaveLength( 1 );

		view.rerender(
			<Drawer.Root open modal="trap-focus">
				<Drawer.Popup>
					<Drawer.Title>Trap focus drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect(
			screen
				.getAllByRole( 'presentation', { hidden: true } )
				.filter( ( element ) => element.hasAttribute( 'data-open' ) )
		).toHaveLength( 1 );
	} );

	it( 'deprioritizes close icon for initial focus', async () => {
		const user = userEvent.setup();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Header>
						<Drawer.Title>Focus test</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<Drawer.Footer>
						<Drawer.Action>Confirm</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Drawer' } )
		);

		const closeButton = screen.getByRole( 'button', { name: 'Close' } );
		const actionButton = screen.getByRole( 'button', { name: 'Confirm' } );

		await waitFor( () => {
			expect( actionButton ).toHaveFocus();
		} );
		expect( closeButton ).toHaveAttribute( 'data-wp-ui-drawer-close-icon' );
	} );

	it( 'supports default and explicit size values across swipe directions', async () => {
		const view = render(
			<Drawer.Root open swipeDirection="left">
				<Drawer.Popup>
					<Drawer.Title>Left drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();

		view.rerender(
			<Drawer.Root open swipeDirection="up">
				<Drawer.Popup>
					<Drawer.Title>Up drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();

		view.rerender(
			<Drawer.Root open swipeDirection="right">
				<Drawer.Popup size="auto">
					<Drawer.Title>Auto drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();

		view.rerender(
			<Drawer.Root open swipeDirection="up">
				<Drawer.Popup size="large">
					<Drawer.Title>Large drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'marks Drawer.Action as disabled when loading is true', async () => {
		render(
			<Drawer.Root open>
				<Drawer.Popup>
					<Drawer.Title>Action states</Drawer.Title>
					<Drawer.Footer>
						<Drawer.Action loading>Loading action</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);

		const action = await screen.findByRole( 'button', {
			name: 'Loading action',
		} );
		expect( action ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'marks Drawer.Action as disabled when disabled is true', async () => {
		render(
			<Drawer.Root open>
				<Drawer.Popup>
					<Drawer.Title>Action states</Drawer.Title>
					<Drawer.Footer>
						<Drawer.Action disabled>Disabled action</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);

		const action = await screen.findByRole( 'button', {
			name: 'Disabled action',
		} );
		expect( action ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'lets explicit disabled={ false } override loading on Drawer.Action', async () => {
		// Mirrors Dialog.Action precedence: `disabled ?? loading`, so an
		// explicit `disabled={ false }` wins over an active loading state.
		render(
			<Drawer.Root open>
				<Drawer.Popup>
					<Drawer.Title>Action states</Drawer.Title>
					<Drawer.Footer>
						<Drawer.Action disabled={ false } loading>
							Explicit not-disabled
						</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);

		const action = await screen.findByRole( 'button', {
			name: 'Explicit not-disabled',
		} );
		expect( action ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	describe( 'Development mode validation', () => {
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

		it( 'should throw when Drawer.Title is missing', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Header>
							{ /* Missing Drawer.Title */ }
						</Drawer.Header>
						<p>Content without a title</p>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Drawer' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Drawer: Missing <Drawer.Title>. ' +
					'For accessibility, every drawer requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should not throw before opening the drawer', async () => {
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Header>
							<Drawer.Title>My Title</Drawer.Title>
						</Drawer.Header>
						<p>Content with a title</p>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await expect( screen.findByRole( 'dialog' ) ).rejects.toThrow();

			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should not throw when Drawer.Title is present', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Header>
							<Drawer.Title>My Title</Drawer.Title>
						</Drawer.Header>
						<p>Content with a title</p>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Drawer' } )
			);

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );

		it( 'should throw when Drawer.Title is empty', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Header>
							<Drawer.Title>{ /* Empty title */ }</Drawer.Title>
						</Drawer.Header>
						<p>Content with empty title</p>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Drawer' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Drawer: <Drawer.Title> cannot be empty. ' +
					'Provide meaningful text content for the drawer title.'
			);

			cleanup();
		} );

		it( 'should throw when title is removed after mount', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			function Test() {
				const [ showTitle, setShowTitle ] = useState( true );
				return (
					<Drawer.Root>
						<Drawer.Trigger>Open</Drawer.Trigger>
						<Drawer.Popup>
							{ showTitle && (
								<Drawer.Title>My Title</Drawer.Title>
							) }
							<button onClick={ () => setShowTitle( false ) }>
								Remove Title
							</button>
						</Drawer.Popup>
					</Drawer.Root>
				);
			}

			render( <Test /> );

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );

			expect( errors ).toHaveLength( 0 );

			await user.click(
				screen.getByRole( 'button', { name: 'Remove Title' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Drawer: Missing <Drawer.Title>. ' +
					'For accessibility, every drawer requires a title. ' +
					'If needed, the title can be visually hidden but must not be omitted.'
			);

			cleanup();
		} );

		it( 'should throw when Drawer.Title contains only whitespace', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Header>
							<Drawer.Title> </Drawer.Title>
						</Drawer.Header>
						<p>Content with whitespace-only title</p>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Drawer' } )
			);

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			expect( errors[ 0 ].message ).toBe(
				'Drawer: <Drawer.Title> cannot be empty. ' +
					'Provide meaningful text content for the drawer title.'
			);

			cleanup();
		} );

		it( 'should not throw when Drawer.Title contains mixed content with text', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Header>
							<Drawer.Title>
								<span aria-hidden="true">☰</span>
								Navigation
							</Drawer.Title>
						</Drawer.Header>
						<p>Content with icon and text title</p>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Open Drawer' } )
			);

			await waitFor( () => {
				expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
			} );
			await new Promise( ( resolve ) => setTimeout( resolve, 50 ) );
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );
	} );
} );
