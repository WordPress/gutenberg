import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from '@wordpress/element';
import * as Drawer from '../index';

function collectUncaughtErrors() {
	const errors: Error[] = [];
	const windowHandler = ( event: ErrorEvent ) => {
		event.preventDefault();
		errors.push( event.error );
	};
	const processHandler = ( error: Error ) => errors.push( error );
	window.addEventListener( 'error', windowHandler );
	process.on( 'uncaughtException', processHandler );
	return {
		errors,
		cleanup: () => {
			window.removeEventListener( 'error', windowHandler );
			process.off( 'uncaughtException', processHandler );
		},
	};
}

describe( 'Drawer', () => {
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
			console.error = vi.fn();
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
		// The Browser Mode coverage in `content.browser.test.tsx` separately
		// verifies that the marker renders as a real layout box rather than
		// `display: contents`, which jsdom cannot observe from computed styles.

		it( 'invokes a consumer-supplied onScroll on Drawer.Content', async () => {
			const user = userEvent.setup();
			const onScroll = vi.fn();
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
