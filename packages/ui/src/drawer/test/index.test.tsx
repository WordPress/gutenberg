import { act, render, screen, waitFor } from '@testing-library/react';
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
		const footerRef = createRef< HTMLElement >();
		const headerRef = createRef< HTMLElement >();
		const titleRef = createRef< HTMLHeadingElement >();
		const descriptionRef = createRef< HTMLParagraphElement >();
		const closeIconRef = createRef< HTMLButtonElement >();
		const contentRef = createRef< HTMLDivElement >();

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
					<Drawer.Content ref={ contentRef }>
						<Drawer.Description ref={ descriptionRef }>
							A test description
						</Drawer.Description>
					</Drawer.Content>
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

		expect( headerRef.current ).toBeInstanceOf( HTMLElement );
		expect( headerRef.current?.tagName ).toBe( 'HEADER' );
		expect( titleRef.current ).toBeInstanceOf( HTMLHeadingElement );
		expect( descriptionRef.current ).toBeInstanceOf( HTMLParagraphElement );
		expect( closeIconRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( footerRef.current ).toBeInstanceOf( HTMLElement );
		expect( footerRef.current?.tagName ).toBe( 'FOOTER' );
		expect( actionRef.current ).toBeInstanceOf( HTMLButtonElement );
		expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'renders Drawer.Header and supports render/className props', async () => {
		const user = userEvent.setup();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Header
						render={ <section data-testid="drawer-header" /> }
						className="custom-header"
					>
						<Drawer.Title>Test Drawer</Drawer.Title>
					</Drawer.Header>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Drawer' } )
		);

		const header = await screen.findByTestId( 'drawer-header' );
		expect( header.tagName ).toBe( 'SECTION' );
		expect( header ).toHaveClass( 'custom-header' );
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
				<Drawer.Popup
					portal={ <Drawer.Portal container={ container } /> }
				>
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

	it( 'merges user `className` on Drawer.Title with the internal one', async () => {
		const user = userEvent.setup();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Title className="custom-title">Title</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

		const heading = await screen.findByRole( 'heading', { name: 'Title' } );
		// The regression this guards against: `useRender` must still forward
		// the user-supplied className to the underlying DOM node. CSS module
		// classes are stubbed in the Jest environment, so we can only assert
		// the user class end-to-end.
		expect( heading ).toHaveClass( 'custom-title' );
	} );

	it( 'associates Drawer.Description with the popup via aria-describedby', async () => {
		const user = userEvent.setup();
		const popupRef = createRef< HTMLDivElement >();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open</Drawer.Trigger>
				<Drawer.Popup ref={ popupRef }>
					<Drawer.Title>Title</Drawer.Title>
					<Drawer.Description>My description</Drawer.Description>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Open' } ) );

		await waitFor( () => {
			expect( popupRef.current ).toHaveAccessibleDescription(
				'My description'
			);
		} );
	} );

	it( 'renders backdrop only when modal is true', async () => {
		const getBackdrops = () => screen.queryAllByTestId( 'drawer-backdrop' );

		const view = render(
			<Drawer.Root open modal>
				<Drawer.Popup>
					<Drawer.Title>Modal drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getBackdrops() ).toHaveLength( 1 );

		view.rerender(
			<Drawer.Root open modal={ false }>
				<Drawer.Popup>
					<Drawer.Title>Non modal drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getBackdrops() ).toHaveLength( 0 );

		view.rerender(
			<Drawer.Root open modal="trap-focus">
				<Drawer.Popup>
					<Drawer.Title>Trap focus drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toBeInTheDocument();
		expect( getBackdrops() ).toHaveLength( 0 );
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

	it( 'does not move focus when initialFocus is false', async () => {
		const user = userEvent.setup();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup initialFocus={ false }>
					<Drawer.Header>
						<Drawer.Title>Focus test</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<button>Content Button</button>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Drawer' } )
		);

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

	it( 'uses a custom initialFocus callback as-is', async () => {
		const user = userEvent.setup();
		const customFocus = jest.fn( () => false as const );

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup initialFocus={ customFocus }>
					<Drawer.Header>
						<Drawer.Title>Focus test</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<button>Content Button</button>
				</Drawer.Popup>
			</Drawer.Root>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Open Drawer' } )
		);

		await waitFor( () => {
			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		} );

		expect( customFocus ).toHaveBeenCalled();
	} );

	it( 'closes on Escape and restores focus to the trigger', async () => {
		const user = userEvent.setup();

		render(
			<Drawer.Root>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Title>Escape test</Drawer.Title>
					Drawer content
				</Drawer.Popup>
			</Drawer.Root>
		);

		const trigger = screen.getByRole( 'button', { name: 'Open Drawer' } );

		await user.click( trigger );
		expect( await screen.findByText( 'Drawer content' ) ).toBeVisible();

		await user.keyboard( '{Escape}' );

		await waitFor( () => {
			expect(
				screen.queryByText( 'Drawer content' )
			).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'defaults swipeDirection to "left"', async () => {
		render(
			<Drawer.Root open>
				<Drawer.Popup>
					<Drawer.Title>Default direction</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toHaveAttribute(
			'data-swipe-direction',
			'left'
		);
	} );

	it( 'supports default and explicit size values across swipe directions', async () => {
		const view = render(
			<Drawer.Root open swipeDirection="left">
				<Drawer.Popup>
					<Drawer.Title>Left drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);

		expect( await screen.findByRole( 'dialog' ) ).toHaveAttribute(
			'data-swipe-direction',
			'left'
		);

		view.rerender(
			<Drawer.Root open swipeDirection="up">
				<Drawer.Popup>
					<Drawer.Title>Up drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toHaveAttribute(
			'data-swipe-direction',
			'up'
		);

		view.rerender(
			<Drawer.Root open swipeDirection="right">
				<Drawer.Popup size="auto">
					<Drawer.Title>Auto drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toHaveAttribute(
			'data-swipe-direction',
			'right'
		);

		view.rerender(
			<Drawer.Root open swipeDirection="down">
				<Drawer.Popup size="large">
					<Drawer.Title>Down drawer</Drawer.Title>
				</Drawer.Popup>
			</Drawer.Root>
		);
		expect( await screen.findByRole( 'dialog' ) ).toHaveAttribute(
			'data-swipe-direction',
			'down'
		);
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
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
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

			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
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

		it( 'should recover when title is added back', async () => {
			const user = userEvent.setup();
			const { errors, cleanup } = collectUncaughtErrors();

			function Test() {
				const [ showTitle, setShowTitle ] = useState( false );
				return (
					<Drawer.Root>
						<Drawer.Trigger>Open</Drawer.Trigger>
						<Drawer.Popup>
							{ showTitle && (
								<Drawer.Title>My Title</Drawer.Title>
							) }
							<button
								onClick={ () => setShowTitle( ( s ) => ! s ) }
							>
								Toggle Title
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

			await waitFor( () => {
				expect( errors.length ).toBeGreaterThan( 0 );
			} );

			const errorCountAfterInitial = errors.length;

			await user.click(
				screen.getByRole( 'button', { name: 'Toggle Title' } )
			);

			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);

			expect( errors ).toHaveLength( errorCountAfterInitial );

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
			await act(
				() => new Promise( ( resolve ) => setTimeout( resolve, 50 ) )
			);
			expect( errors ).toHaveLength( 0 );

			cleanup();
		} );
	} );

	describe( 'overlay scroll container', () => {
		it( 'marks Drawer.Content with data-wp-ui-overlay-scroll-container', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Title>Title</Drawer.Title>
						<Drawer.Content ref={ contentRef }>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( contentRef.current ).toHaveAttribute(
				'data-wp-ui-overlay-scroll-container'
			);
		} );

		// Locks the wrapper structure that Drawer.Content relies on:
		//
		// - The forwarded ref / scroll listener / overlay-chrome class
		//   must land on the visible scroll container (the outer div),
		//   so it does NOT carry [data-drawer-content].
		// - Base UI's [data-drawer-content] marker must sit *inside*
		//   that scroll container so the popup-edge padding gutter
		//   falls outside the marker and stays mouse-draggable for
		//   swipe-dismiss (Base UI excludes mouse-drag swipe over
		//   [data-drawer-content] to preserve text selection).
		//
		// Not asserted here: the marker rendering as a real block-level
		// element rather than `display: contents` (which would neuter
		// `useOverlayScrollStateAttributes`'s `ResizeObserver`). CSS
		// modules resolve to empty stubs in this jsdom test environment,
		// so a `display: contents` regression introduced via CSS would
		// not be observable from `getComputedStyle`. Catching it
		// requires reviewing the marker's stylesheet rules at code
		// review time.
		it( 'wraps a [data-drawer-content] marker as the only direct child', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Title>Title</Drawer.Title>
						<Drawer.Content ref={ contentRef }>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			} );

			expect( contentRef.current ).not.toHaveAttribute(
				'data-drawer-content'
			);

			// Direct DOM access is intentional: this test locks the
			// concrete element-level wrapping that other invariants
			// (mouse-drag swipe-dismiss, ResizeObserver-driven scroll
			// state) silently depend on.
			// eslint-disable-next-line testing-library/no-node-access
			const marker = contentRef.current?.firstElementChild;
			expect( marker ).toBeInstanceOf( HTMLDivElement );
			expect( marker ).toHaveAttribute( 'data-drawer-content' );
			// eslint-disable-next-line testing-library/no-node-access
			expect( contentRef.current?.children ).toHaveLength( 1 );
		} );

		it( 'sets data-wp-ui-overlay-modal on the popup when modal is true', async () => {
			const user = userEvent.setup();
			const popupRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root modal>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup ref={ popupRef }>
						<Drawer.Title>Title</Drawer.Title>
					</Drawer.Popup>
				</Drawer.Root>
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
					<Drawer.Root modal={ modal }>
						<Drawer.Trigger>Open</Drawer.Trigger>
						<Drawer.Popup ref={ popupRef }>
							<Drawer.Title>Title</Drawer.Title>
						</Drawer.Popup>
					</Drawer.Root>
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

		it( 'pins Drawer.Header when rendered as a sibling of Drawer.Content', async () => {
			const user = userEvent.setup();
			const popupRef = createRef< HTMLDivElement >();
			const headerRef = createRef< HTMLElement >();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup ref={ popupRef }>
						<Drawer.Header ref={ headerRef }>
							<Drawer.Title>Title</Drawer.Title>
						</Drawer.Header>
						<Drawer.Content ref={ contentRef }>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( headerRef.current ).toBeInstanceOf( HTMLElement );
			} );

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

		it( 'scrolls Drawer.Header with the body when nested inside Drawer.Content', async () => {
			const user = userEvent.setup();
			const headerRef = createRef< HTMLElement >();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Content ref={ contentRef }>
							<Drawer.Header ref={ headerRef }>
								<Drawer.Title>Title</Drawer.Title>
							</Drawer.Header>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Open' } ) );
			await waitFor( () => {
				expect( headerRef.current ).toBeInstanceOf( HTMLElement );
			} );

			expect( contentRef.current ).toContainElement( headerRef.current );
		} );

		it( 'invokes a consumer-supplied onScroll on Drawer.Content', async () => {
			const user = userEvent.setup();
			const onScroll = jest.fn();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Title>Title</Drawer.Title>
						<Drawer.Content
							ref={ contentRef }
							onScroll={ onScroll }
						>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
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

		it( 'toggles tabindex="0" on Drawer.Content based on overflow', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Title>Title</Drawer.Title>
						<Drawer.Content ref={ contentRef }>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
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

		it( 'toggles data-wp-ui-overlay-scrolled-from-* based on scroll position', async () => {
			const user = userEvent.setup();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<Drawer.Root>
					<Drawer.Trigger>Open</Drawer.Trigger>
					<Drawer.Popup>
						<Drawer.Title>Title</Drawer.Title>
						<Drawer.Content ref={ contentRef }>
							<p>Body</p>
						</Drawer.Content>
					</Drawer.Popup>
				</Drawer.Root>
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

			setScrollTop( 0 );
			expect( content ).not.toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);

			setScrollTop( 200 );
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-top'
			);
			expect( content ).toHaveAttribute(
				'data-wp-ui-overlay-scrolled-from-bottom'
			);

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
