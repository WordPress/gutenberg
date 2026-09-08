/* eslint-disable testing-library/no-container, testing-library/no-node-access -- Measurement behavior requires access to the hidden intrinsic tree and element geometry. */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { HTMLAttributes } from 'react';
import * as Breadcrumb from '../index';

type ResizeObserverRecord = {
	callback: ResizeObserverCallback;
	disconnected: boolean;
	elements: Set< Element >;
};

const DEFAULT_LABEL_WIDTH = 30;
const NEW_TAB_INDICATOR_WIDTH = 20;
const OVERFLOW_TRIGGER_WIDTH = 30;
const SEPARATOR_WIDTH = 10;

describe( 'Breadcrumb', () => {
	let availableWidth: number;
	let listAvailableWidth: number | null;
	let labelWidths: Map< string, number >;
	let resizeObservers: ResizeObserverRecord[];
	let animationFrames: FrameRequestCallback[];
	let originalClientWidth: PropertyDescriptor | undefined;
	let originalScrollWidth: PropertyDescriptor | undefined;
	let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;
	let originalResizeObserver: typeof ResizeObserver;
	let originalRequestAnimationFrame: typeof requestAnimationFrame;
	let originalCancelAnimationFrame: typeof cancelAnimationFrame;
	let originalFonts: PropertyDescriptor | undefined;

	beforeEach( () => {
		availableWidth = 500;
		listAvailableWidth = null;
		labelWidths = new Map();
		resizeObservers = [];
		animationFrames = [];
		originalClientWidth = Object.getOwnPropertyDescriptor(
			HTMLElement.prototype,
			'clientWidth'
		);
		originalScrollWidth = Object.getOwnPropertyDescriptor(
			HTMLElement.prototype,
			'scrollWidth'
		);
		originalGetBoundingClientRect =
			HTMLElement.prototype.getBoundingClientRect;
		originalResizeObserver = global.ResizeObserver;
		originalRequestAnimationFrame = global.requestAnimationFrame;
		originalCancelAnimationFrame = global.cancelAnimationFrame;
		originalFonts = Object.getOwnPropertyDescriptor( document, 'fonts' );

		global.ResizeObserver = class {
			elements = new Set< Element >();
			private record: ResizeObserverRecord;

			constructor( callback: ResizeObserverCallback ) {
				this.record = {
					callback,
					disconnected: false,
					elements: this.elements,
				};
				resizeObservers.push( this.record );
			}

			observe( element: Element ) {
				this.elements.add( element );
			}

			unobserve( element: Element ) {
				this.elements.delete( element );
			}

			disconnect() {
				this.record.disconnected = true;
				this.elements.clear();
			}
		} as unknown as typeof ResizeObserver;

		global.requestAnimationFrame = jest.fn( ( callback ) => {
			animationFrames.push( callback );
			return animationFrames.length;
		} );
		global.cancelAnimationFrame = jest.fn();

		Object.defineProperty( HTMLElement.prototype, 'scrollWidth', {
			configurable: true,
			get() {
				const element = this as HTMLElement;
				if (
					element.classList.contains( 'style-measurement-content' )
				) {
					const label =
						element.firstElementChild as HTMLElement | null;
					const inlineMargin = Number.parseFloat(
						label?.style.marginInline || '0'
					);
					const inlineStartMargin = Number.parseFloat(
						label?.style.marginInlineStart || '0'
					);
					const inlineEndMargin = Number.parseFloat(
						label?.style.marginInlineEnd || '0'
					);
					return (
						( label?.scrollWidth ?? 0 ) +
						inlineMargin * 2 +
						inlineStartMargin +
						inlineEndMargin
					);
				}
				if (
					element.classList.contains(
						'style-measurement-overflow-trigger'
					)
				) {
					return OVERFLOW_TRIGGER_WIDTH;
				}
				if ( element.classList.contains( 'style-separator' ) ) {
					return SEPARATOR_WIDTH;
				}
				if ( element.classList.contains( 'style-label' ) ) {
					const intrinsicWidthElement = element.querySelector(
						'[data-intrinsic-width]'
					);
					const intrinsicWidth = Number.parseFloat(
						intrinsicWidthElement?.getAttribute(
							'data-intrinsic-width'
						) ?? ''
					);
					const indicatorWidth = element.matches(
						'[target="_blank"]'
					)
						? NEW_TAB_INDICATOR_WIDTH
						: 0;
					const configuredLabelWidth = labelWidths.get(
						element.textContent ?? ''
					);
					const labelWidth = Number.isNaN( intrinsicWidth )
						? configuredLabelWidth ?? DEFAULT_LABEL_WIDTH
						: intrinsicWidth;
					return labelWidth + indicatorWidth;
				}
				return 0;
			},
		} );
		Object.defineProperty( HTMLElement.prototype, 'clientWidth', {
			configurable: true,
			get() {
				const element = this as HTMLElement;
				if ( element.classList.contains( 'style-list' ) ) {
					return listAvailableWidth ?? availableWidth;
				}
				if ( element.getAttribute( 'role' ) === 'navigation' ) {
					return availableWidth;
				}
				if ( element.hasAttribute( 'data-constrained' ) ) {
					return 20;
				}
				if (
					element.getAttribute( 'aria-current' ) === 'page' &&
					element.parentElement?.classList.contains(
						'style-current-item-truncating'
					)
				) {
					return Math.max(
						0,
						availableWidth -
							OVERFLOW_TRIGGER_WIDTH -
							SEPARATOR_WIDTH
					);
				}
				return element.scrollWidth;
			},
		} );
		HTMLElement.prototype.getBoundingClientRect = function () {
			let width = this.scrollWidth;
			if ( this.getAttribute( 'role' ) === 'navigation' ) {
				width = availableWidth;
			} else if ( this.classList.contains( 'style-list' ) ) {
				width = this.clientWidth;
			}
			return {
				bottom: 0,
				height: 0,
				left: 0,
				right: width,
				top: 0,
				width,
				x: 0,
				y: 0,
				toJSON: () => {},
			};
		};
	} );

	afterEach( () => {
		if ( originalClientWidth ) {
			Object.defineProperty(
				HTMLElement.prototype,
				'clientWidth',
				originalClientWidth
			);
		}
		if ( originalScrollWidth ) {
			Object.defineProperty(
				HTMLElement.prototype,
				'scrollWidth',
				originalScrollWidth
			);
		}
		HTMLElement.prototype.getBoundingClientRect =
			originalGetBoundingClientRect;
		global.ResizeObserver = originalResizeObserver;
		global.requestAnimationFrame = originalRequestAnimationFrame;
		global.cancelAnimationFrame = originalCancelAnimationFrame;
		if ( originalFonts ) {
			Object.defineProperty( document, 'fonts', originalFonts );
		} else {
			Reflect.deleteProperty( document, 'fonts' );
		}
	} );

	function flushAnimationFrames() {
		const callbacks = animationFrames.splice( 0 );
		callbacks.forEach( ( callback ) => callback( performance.now() ) );
	}

	function flushAllAnimationFrames() {
		while ( animationFrames.length > 0 ) {
			flushAnimationFrames();
		}
	}

	function notifyResize( element?: Element ) {
		act( () => {
			resizeObservers
				.filter(
					( observer ) =>
						! element || observer.elements.has( element )
				)
				.forEach( ( observer ) =>
					observer.callback( [], {} as ResizeObserver )
				);
			flushAnimationFrames();
		} );
	}

	function renderDefaultTrail() {
		return render(
			<Breadcrumb.Root>
				<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
				<Breadcrumb.LinkItem href="/section">
					Section
				</Breadcrumb.LinkItem>
				<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
			</Breadcrumb.Root>
		);
	}

	describe( 'semantics and API', () => {
		it( 'renders one named navigation landmark with an ordered list', () => {
			renderDefaultTrail();

			const navigation = screen.getByRole( 'navigation', {
				name: 'Breadcrumbs',
			} );
			expect( navigation.tagName ).toBe( 'NAV' );
			expect( screen.getByRole( 'list' ).tagName ).toBe( 'OL' );
			expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 2 );
			expect(
				screen.getByText( 'Current', {
					selector: '[aria-current="page"]',
				} )
			).not.toHaveAttribute( 'href' );

			const separators = screen
				.getByRole( 'list' )
				.querySelectorAll( '.style-separator' );
			expect( separators ).toHaveLength( 2 );
			separators.forEach( ( separator ) =>
				expect( separator ).toHaveAttribute( 'aria-hidden', 'true' )
			);
		} );

		it( 'keeps the intrinsic tree inert and out of the accessibility tree', () => {
			const { container } = renderDefaultTrail();
			const measurementTree =
				container.querySelector( '.style-measurement' );

			expect( measurementTree ).toHaveAttribute( 'inert' );
			expect( measurementTree ).toHaveAttribute( 'aria-hidden', 'true' );
			expect(
				measurementTree?.querySelector( 'a, button, nav' )
			).toBeNull();
			expect(
				measurementTree?.querySelector(
					'.style-measurement-label.style-link'
				)
			).toHaveProperty( 'tagName', 'SPAN' );
			expect(
				measurementTree?.querySelector(
					'.style-measurement-overflow-trigger'
				)
			).toHaveProperty( 'tagName', 'SPAN' );
			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 2 );
			expect( screen.getAllByRole( 'navigation' ) ).toHaveLength( 1 );
		} );

		it( 'preserves required semantics when Root uses a custom renderer', () => {
			render(
				<Breadcrumb.Root
					aria-label="Location"
					render={ <div role="presentation" /> }
				>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const navigation = screen.getByRole( 'navigation', {
				name: 'Location',
			} );
			expect( navigation.tagName ).toBe( 'DIV' );
			expect( navigation ).toHaveAttribute( 'role', 'navigation' );
		} );

		it( 'forwards refs to the landmark and rendered item elements', () => {
			const rootRef = createRef< HTMLElement >();
			const linkRef = createRef< HTMLAnchorElement >();
			const currentRef = createRef< HTMLSpanElement >();

			render(
				<Breadcrumb.Root ref={ rootRef }>
					<Breadcrumb.LinkItem ref={ linkRef } href="/">
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem ref={ currentRef }>
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect( rootRef.current?.tagName ).toBe( 'NAV' );
			expect( linkRef.current?.tagName ).toBe( 'A' );
			expect( currentRef.current?.tagName ).toBe( 'SPAN' );
		} );

		it( 'passes complete link props through a custom renderer', () => {
			const href = '/settings/general?section=writing#defaults';
			const renderLink = jest.fn(
				( {
					children: linkChildren,
					...linkProps
				}: HTMLAttributes< HTMLElement > ) => (
					<a data-router-link { ...linkProps }>
						{ linkChildren }
					</a>
				)
			);

			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem
						href={ href }
						openInNewTab
						render={ renderLink }
					>
						General
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const link = screen.getByRole( 'link', {
				name: 'General (opens in a new tab)',
			} );
			expect( link ).toHaveAttribute( 'href', href );
			expect( link ).toHaveAttribute( 'target', '_blank' );
			expect(
				within( link ).getByLabelText( '(opens in a new tab)' )
			).toBeVisible();
			expect( link ).toHaveAttribute( 'data-router-link' );
			expect( renderLink ).toHaveBeenCalled();
		} );

		it( 'does not let custom renderers override required item semantics', () => {
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem
						href="/required"
						render={ ( renderProps ) => (
							<a
								{ ...renderProps }
								aria-current="page"
								href="/wrong"
							>
								{ renderProps.children }
							</a>
						) }
					>
						Ancestor
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem
						render={ ( renderProps ) => (
							<a
								{ ...renderProps }
								aria-current="step"
								href="/wrong"
								tabIndex={ -1 }
							>
								{ renderProps.children }
							</a>
						) }
					>
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const ancestor = screen.getByRole( 'link', { name: 'Ancestor' } );
			expect( ancestor ).toHaveAttribute( 'href', '/required' );
			expect( ancestor ).not.toHaveAttribute( 'aria-current' );

			const current = screen.getByText( 'Current', {
				selector: '[aria-current="page"]',
			} );
			expect( current ).toHaveAttribute( 'aria-current', 'page' );
			expect( current ).not.toHaveAttribute( 'href' );
			expect( current ).not.toHaveAttribute( 'tabindex' );
		} );

		it( 'mirrors consumer styling into intrinsic measurements', () => {
			const { container } = render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem
						className="item-class"
						href="/"
						render={
							<a
								className="render-class"
								href="/"
								style={ { letterSpacing: '3px' } }
							>
								Home
							</a>
						}
						style={ { fontSize: '20px' } }
					>
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const measurement = container.querySelector(
				'.style-measurement-label'
			);
			expect( measurement ).toHaveClass( 'item-class', 'render-class' );
			expect( measurement ).toHaveStyle( {
				fontSize: '20px',
				letterSpacing: '3px',
			} );
		} );

		it( 'collapses items based on custom-rendered link widths', () => {
			availableWidth = 110;

			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem
						href="/"
						render={ ( renderProps ) => (
							<a { ...renderProps }>
								<span data-intrinsic-width="90">
									{ renderProps.children }
								</span>
							</a>
						) }
					>
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Show 1 hidden breadcrumb item',
				} )
			).toBeInTheDocument();
		} );

		it( 'keeps custom renderer refs on the visible item', () => {
			const renderRef = createRef< HTMLAnchorElement >();
			const { container } = render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem
						href="/"
						render={
							<a ref={ renderRef } href="/">
								Home
							</a>
						}
					>
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const visibleLink = screen.getByRole( 'link', { name: 'Home' } );
			const measurementTree =
				container.querySelector( '.style-measurement' );

			expect( renderRef.current ).toBe( visibleLink );
			expect( measurementTree ).not.toContainElement( renderRef.current );
		} );
	} );

	describe( 'development validation', () => {
		it( 'rejects unsupported direct children', () => {
			expect( () =>
				render(
					<Breadcrumb.Root>
						<div>Invalid</div>
						<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
						<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
					</Breadcrumb.Root>
				)
			).toThrow( /only accepts/ );
			expect( console ).toHaveErrored();
		} );

		it( 'requires at least one ancestor link', () => {
			expect( () =>
				render(
					<Breadcrumb.Root>
						<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
					</Breadcrumb.Root>
				)
			).toThrow( /at least one/ );
			expect( console ).toHaveErrored();
		} );

		it( 'requires exactly one final current item', () => {
			expect( () =>
				render(
					<Breadcrumb.Root>
						<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					</Breadcrumb.Root>
				)
			).toThrow( /requires one final/ );

			expect( () =>
				render(
					<Breadcrumb.Root>
						<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
						<Breadcrumb.CurrentItem>One</Breadcrumb.CurrentItem>
						<Breadcrumb.CurrentItem>Two</Breadcrumb.CurrentItem>
					</Breadcrumb.Root>
				)
			).toThrow( /exactly one/ );

			expect( () =>
				render(
					<Breadcrumb.Root>
						<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
						<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					</Breadcrumb.Root>
				)
			).toThrow( /must be the final child/ );
			expect( console ).toHaveErrored();
		} );

		it( 'requires usable href and text labels', () => {
			expect( () =>
				render(
					<Breadcrumb.Root>
						<Breadcrumb.LinkItem href="">Home</Breadcrumb.LinkItem>
						<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
					</Breadcrumb.Root>
				)
			).toThrow( /usable `href`/ );

			expect( () =>
				render(
					<Breadcrumb.Root>
						<Breadcrumb.LinkItem href="/"> </Breadcrumb.LinkItem>
						<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
					</Breadcrumb.Root>
				)
			).toThrow( /non-empty text label/ );
			expect( console ).toHaveErrored();
		} );

		it( 'requires stable keys for items rendered from a nested array', () => {
			expect( () =>
				render(
					<Breadcrumb.Root>
						{ [
							// eslint-disable-next-line react/jsx-key -- Missing key is the behavior under test.
							<Breadcrumb.LinkItem href="/">
								Home
							</Breadcrumb.LinkItem>,
						] }
						<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
					</Breadcrumb.Root>
				)
			).toThrow( /stable React keys/ );
			expect( console ).toHaveErrored();
		} );
	} );

	describe( 'overflow menu', () => {
		it( 'uses the shared small neutral minimal button treatment', () => {
			availableWidth = 150;
			labelWidths.set( 'Section', 80 );
			renderDefaultTrail();

			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );
			expect( trigger ).toHaveClass(
				'style-is-neutral',
				'style-is-minimal',
				'style-is-small'
			);
		} );

		it( 'contains exactly the collapsed link and closes on activation', async () => {
			const user = userEvent.setup();
			availableWidth = 164;
			labelWidths.set( 'Section', 80 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem
						href="/section"
						onClick={ ( event ) => event.preventDefault() }
					>
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/page">Page</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 2 );
			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );
			expect( trigger ).toHaveAttribute( 'aria-haspopup', 'menu' );
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

			await user.click( trigger );
			act( flushAllAnimationFrames );

			const menu = await screen.findByRole( 'menu' );
			const menuLink = screen.getByRole( 'menuitem', {
				name: 'Section',
			} );
			expect( menu ).toContainElement( menuLink );
			expect( menuLink ).toHaveAttribute( 'href', '/section' );
			expect(
				screen.queryByRole( 'menuitem', { name: 'Home' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'menuitem', { name: 'Current' } )
			).not.toBeInTheDocument();

			await user.click( menuLink );
			act( flushAllAnimationFrames );
			await waitFor( () =>
				expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
			);
		} );

		it( 'uses pluralized labels and supports menu keyboard behavior', async () => {
			const user = userEvent.setup();
			availableWidth = 164;
			labelWidths.set( 'Alpha', 70 );
			labelWidths.set( 'Beta', 60 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/alpha">
						Alpha
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/beta">Beta</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/page">Page</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Show 2 hidden breadcrumb items',
			} );
			act( () => trigger.focus() );
			await user.keyboard( ' ' );
			act( flushAllAnimationFrames );

			const alpha = await screen.findByRole( 'menuitem', {
				name: 'Alpha',
			} );
			const beta = screen.getByRole( 'menuitem', { name: 'Beta' } );
			await waitFor( () => expect( alpha ).toHaveFocus() );

			await user.keyboard( '{ArrowDown}' );
			expect( beta ).toHaveFocus();
			await user.keyboard( '{ArrowUp}' );
			expect( alpha ).toHaveFocus();
			await user.keyboard( '{End}' );
			expect( beta ).toHaveFocus();
			await user.keyboard( '{Home}' );
			expect( alpha ).toHaveFocus();
			await user.keyboard( 'b' );
			expect( beta ).toHaveFocus();
			await user.keyboard( '{Escape}' );
			act( flushAllAnimationFrames );
			await waitFor( () => expect( trigger ).toHaveFocus() );

			await user.keyboard( '{Enter}' );
			act( flushAllAnimationFrames );
			const reopenedAlpha = await screen.findByRole( 'menuitem', {
				name: 'Alpha',
			} );
			await waitFor( () => expect( reopenedAlpha ).toHaveFocus() );
			await user.keyboard( '{Tab}' );
			act( flushAllAnimationFrames );
			await waitFor( () =>
				expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
			);
		} );

		it( 'activates an overflow link from the keyboard', async () => {
			const user = userEvent.setup();
			const handleClick = jest.fn( ( event ) => event.preventDefault() );
			availableWidth = 164;
			labelWidths.set( 'Section', 80 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem
						href="/section"
						onClick={ handleClick }
					>
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/page">Page</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );
			act( () => trigger.focus() );
			await user.keyboard( '{Enter}' );
			act( flushAllAnimationFrames );
			const menuLink = await screen.findByRole( 'menuitem', {
				name: 'Section',
			} );
			await waitFor( () => expect( menuLink ).toHaveFocus() );

			await user.keyboard( '{Enter}' );
			act( flushAllAnimationFrames );
			expect( handleClick ).toHaveBeenCalledTimes( 1 );
			await waitFor( () =>
				expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
			);
		} );

		it( 'passes the same custom renderer and complete href to menu links', async () => {
			const user = userEvent.setup();
			availableWidth = 84;
			labelWidths.set( 'Settings', 100 );
			const renderLink = jest.fn(
				( {
					children: linkChildren,
					...linkProps
				}: HTMLAttributes< HTMLElement > ) => (
					<a data-router-link { ...linkProps }>
						{ linkChildren }
					</a>
				)
			);

			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem
						href="/settings?tab=writing#defaults"
						openInNewTab
						render={ renderLink }
					>
						Settings
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Show 1 hidden breadcrumb item',
				} )
			);
			act( flushAllAnimationFrames );
			const menuLink = await screen.findByRole( 'menuitem', {
				name: 'Settings (opens in a new tab)',
			} );
			expect( menuLink ).toHaveAttribute(
				'href',
				'/settings?tab=writing#defaults'
			);
			expect( menuLink ).toHaveAttribute( 'data-router-link' );
			expect( menuLink ).toHaveAttribute( 'target', '_blank' );
			expect(
				within( menuLink ).getByLabelText( '(opens in a new tab)' )
			).toBeVisible();
		} );

		it( 'freezes the visible and menu collections while open', async () => {
			const user = userEvent.setup();
			availableWidth = 164;
			labelWidths.set( 'Alpha', 70 );
			labelWidths.set( 'Beta', 60 );
			const { rerender } = render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/alpha">
						Alpha
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/beta">Beta</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/page">Page</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Show 2 hidden breadcrumb items',
			} );
			await user.click( trigger );
			act( flushAllAnimationFrames );
			expect( await screen.findAllByRole( 'menuitem' ) ).toHaveLength(
				2
			);

			availableWidth = 500;
			notifyResize();
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 2 );
			expect( trigger ).toBeInTheDocument();
			rerender(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/dashboard">
						Dashboard
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 2 );

			await user.keyboard( '{Escape}' );
			act( flushAllAnimationFrames );
			await waitFor( () => expect( trigger ).toHaveFocus() );
			expect( trigger ).toBeInTheDocument();

			act( () => trigger.blur() );
			await waitFor( () => {
				expect(
					screen.queryByRole( 'button', {
						name: /hidden breadcrumb/,
					} )
				).not.toBeInTheDocument();
			} );
			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 1 );
		} );

		it( 'keeps a focused overflow trigger until it loses focus', async () => {
			availableWidth = 140;
			labelWidths.set( 'Section', 80 );
			renderDefaultTrail();
			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );

			act( () => trigger.focus() );
			availableWidth = 500;
			notifyResize();
			expect( trigger ).toHaveFocus();
			expect( trigger ).toBeInTheDocument();

			act( () => trigger.blur() );
			await waitFor( () => expect( trigger ).not.toBeInTheDocument() );
			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 2 );
		} );

		it( 'recalculates collapsed items when the overflow trigger remains focused during resize', async () => {
			availableWidth = 140;
			labelWidths.set( 'Section', 80 );
			renderDefaultTrail();
			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );

			act( () => trigger.focus() );
			await screen.findByText( 'Show 1 hidden breadcrumb item' );
			availableWidth = 100;
			notifyResize();

			expect( trigger ).toHaveFocus();
			expect(
				screen.getByRole( 'button', {
					name: 'Show 2 hidden breadcrumb items',
				} )
			).toBe( trigger );
			expect(
				screen.queryByRole( 'link', { name: 'Home' } )
			).not.toBeInTheDocument();
		} );

		it( 'discards a deferred layout when newer geometry supersedes it', async () => {
			availableWidth = 140;
			labelWidths.set( 'Section', 80 );
			renderDefaultTrail();
			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );

			act( () => trigger.focus() );
			await screen.findByText( 'Show 1 hidden breadcrumb item' );
			availableWidth = 500;
			notifyResize();
			availableWidth = 140;
			notifyResize();
			act( () => trigger.blur() );

			expect( trigger ).toBeInTheDocument();
			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 1 );
		} );

		it( 'keeps keyed layout state paired while the trigger is focused', async () => {
			availableWidth = 140;
			labelWidths.set( 'Section', 80 );
			const { rerender } = render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem key="home" href="/">
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="section" href="/section">
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem key="current">
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );

			act( () => trigger.focus() );
			await screen.findByText( 'Show 1 hidden breadcrumb item' );
			labelWidths.set( 'Reports', 80 );
			rerender(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem key="dashboard" href="/dashboard">
						Dashboard
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="reports" href="/reports">
						Reports
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem key="current">
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			expect( trigger ).toHaveFocus();
			expect( trigger ).toBeInTheDocument();

			act( () => trigger.blur() );
			expect(
				screen.getByRole( 'button', {
					name: 'Show 1 hidden breadcrumb item',
				} )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'link', { name: 'Dashboard' } )
			).toBeInTheDocument();
		} );

		it( 'pins a focused link or deliberately moves focus to overflow', async () => {
			availableWidth = 500;
			labelWidths.set( 'Beta', 100 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/alpha">
						Alpha
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/beta">Beta</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const alpha = screen.getByRole( 'link', { name: 'Alpha' } );
			act( () => alpha.focus() );
			availableWidth = 164;
			notifyResize();
			expect( alpha ).toHaveFocus();
			expect(
				screen.getByRole( 'button', {
					name: 'Show 1 hidden breadcrumb item',
				} )
			).toBeInTheDocument();

			availableWidth = 100;
			notifyResize();
			const trigger = screen.getByRole( 'button', {
				name: 'Show 3 hidden breadcrumb items',
			} );
			expect( trigger ).toHaveFocus();
			await screen.findByText( 'Show 3 hidden breadcrumb items' );
			act( () => trigger.blur() );
			await waitFor( () =>
				expect(
					screen.queryByRole( 'tooltip' )
				).not.toBeInTheDocument()
			);
		} );

		it( 'moves focus to overflow when the focused link collapses without changing the collapsed count', async () => {
			availableWidth = 130;
			labelWidths.set( 'Home', 50 );
			labelWidths.set( 'Section', 50 );
			const { container } = render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/section">
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			const home = screen.getByRole( 'link', { name: 'Home' } );
			expect(
				screen.queryByRole( 'link', { name: 'Section' } )
			).not.toBeInTheDocument();

			act( () => home.focus() );
			labelWidths.set( 'Home', 60 );
			const homeMetric = Array.from(
				container.querySelectorAll( '.style-measurement-content' )
			).find( ( element ) => element.textContent === 'Home' );
			notifyResize( homeMetric );

			const trigger = screen.getByRole( 'button', {
				name: 'Show 1 hidden breadcrumb item',
			} );
			expect( trigger ).toHaveFocus();
			expect(
				screen.getByRole( 'link', { name: 'Section' } )
			).toBeInTheDocument();
			await screen.findByText( 'Show 1 hidden breadcrumb item' );
			act( () => trigger.blur() );
			await waitFor( () =>
				expect(
					screen.queryByRole( 'tooltip' )
				).not.toBeInTheDocument()
			);
		} );
	} );

	describe( 'truncated-label tooltips', () => {
		it( 'keeps an untruncated current item out of the tab order', () => {
			renderDefaultTrail();
			const current = screen.getByText( 'Current', {
				selector: '[aria-current="page"]',
			} );

			expect( current ).not.toHaveAttribute( 'tabindex' );
			expect( screen.getAllByText( 'Current' ) ).toHaveLength( 2 );
		} );

		it( 'makes a truncated current item focusable and preserves focus when it expands', async () => {
			availableWidth = 70;
			labelWidths.set( 'A very long current page', 100 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>
						A very long current page
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const current = screen.getByText( 'A very long current page', {
				selector: '[aria-current="page"]',
			} );
			await waitFor( () =>
				expect( current ).toHaveAttribute( 'tabindex', '0' )
			);
			act( () => current.focus() );
			await waitFor( () =>
				expect(
					screen.getAllByText( 'A very long current page' )
				).toHaveLength( 3 )
			);

			availableWidth = 500;
			notifyResize();
			await waitFor( () => expect( current ).toHaveFocus() );
			expect( current ).toHaveAttribute( 'tabindex', '0' );
			expect( current ).toHaveClass( 'style-outset-ring-focus-visible' );

			act( () => current.blur() );
			await waitFor( () =>
				expect( current ).not.toHaveAttribute( 'tabindex' )
			);
			expect( current ).not.toHaveClass(
				'style-outset-ring-focus-visible'
			);
		} );

		it( 'shows the full text for an actually clipped link on focus', async () => {
			labelWidths.set( 'Constrained ancestor', 100 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/" data-constrained="true">
						Constrained ancestor
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const link = screen.getByRole( 'link', {
				name: 'Constrained ancestor',
			} );
			act( () => link.focus() );
			await waitFor( () =>
				expect(
					screen.getAllByText( 'Constrained ancestor' )
				).toHaveLength( 3 )
			);
			expect( link ).toHaveTextContent( 'Constrained ancestor' );
		} );

		it( 'shows a clipped label tooltip on hover and dismisses it with Escape', async () => {
			const user = userEvent.setup();
			labelWidths.set( 'Constrained ancestor', 100 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/" data-constrained="true">
						Constrained ancestor
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			const link = screen.getByRole( 'link', {
				name: 'Constrained ancestor',
			} );
			await user.hover( link );
			await waitFor( () =>
				expect(
					screen.getAllByText( 'Constrained ancestor' )
				).toHaveLength( 3 )
			);
			expect( link ).toHaveAccessibleName( 'Constrained ancestor' );

			await user.keyboard( '{Escape}' );
			act( flushAllAnimationFrames );
			await waitFor( () =>
				expect(
					screen.getAllByText( 'Constrained ancestor' )
				).toHaveLength( 2 )
			);
		} );
	} );

	describe( 'measurement lifecycle', () => {
		it( 'subtracts focus-ring padding from the available inline size', () => {
			availableWidth = 164;
			labelWidths.set( 'Section', 80 );
			renderDefaultTrail();

			const list = screen.getByRole( 'list' );
			expect(
				screen.queryByRole( 'button', { name: /hidden breadcrumb/ } )
			).not.toBeInTheDocument();

			list.style.paddingInline = '4px';
			notifyResize( list );

			expect(
				screen.getByRole( 'button', { name: /hidden breadcrumb/ } )
			).toBeInTheDocument();
		} );

		it( 'measures the visible list content box inside a padded Root', () => {
			availableWidth = 500;
			listAvailableWidth = 140;
			labelWidths.set( 'Section', 80 );
			render(
				<Breadcrumb.Root style={ { paddingInline: '180px' } }>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem href="/section">
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect(
				screen.getByRole( 'button', { name: /hidden breadcrumb/ } )
			).toBeInTheDocument();
		} );

		it( 'includes consumer inline margins in intrinsic item widths', () => {
			availableWidth = 164;
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem
						href="/section"
						style={ { marginInline: '30px' } }
					>
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect(
				screen.getByRole( 'button', { name: /hidden breadcrumb/ } )
			).toBeInTheDocument();
		} );

		it( 'accounts for the new-tab indicator in intrinsic link widths', () => {
			availableWidth = 75;
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/" openInNewTab>
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Show 1 hidden breadcrumb item',
				} )
			).toBeInTheDocument();
		} );

		it( 'recalculates after items are added and reordered', () => {
			const { rerender } = render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem key="home" href="/">
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="section" href="/section">
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem key="current">
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			const observersBeforeRerender = [ ...resizeObservers ];

			rerender(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem key="section" href="/section">
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="home" href="/">
						Home
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="archive" href="/archive">
						Archive
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem key="current">
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);

			expect(
				screen
					.getAllByRole( 'link' )
					.map( ( link ) => link.textContent )
			).toEqual( [ 'Section', 'Home', 'Archive' ] );
			expect(
				observersBeforeRerender.every(
					( observer ) => observer.disconnected
				)
			).toBe( true );
			expect( resizeObservers.length ).toBeGreaterThan(
				observersBeforeRerender.length
			);

			rerender(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem key="section" href="/section">
						Section
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="archive" href="/archive">
						Archive
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem key="current">
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			expect(
				screen
					.getAllByRole( 'link' )
					.map( ( link ) => link.textContent )
			).toEqual( [ 'Section', 'Archive' ] );

			rerender(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem key="section" href="/projects">
						Projects
					</Breadcrumb.LinkItem>
					<Breadcrumb.LinkItem key="archive" href="/library">
						Library
					</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem key="current">
						Current
					</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			expect(
				screen
					.getAllByRole( 'link' )
					.map( ( link ) => link.textContent )
			).toEqual( [ 'Projects', 'Library' ] );
		} );

		it( 'observes the available container, intrinsic row, and individual items', () => {
			const { container } = renderDefaultTrail();
			const navigation = screen.getByRole( 'navigation' );
			const row = container.querySelector( '.style-measurement-row' );
			const item = container.querySelector(
				'.style-measurement-content'
			);
			const measurementObserver = resizeObservers.find( ( observer ) =>
				observer.elements.has( navigation )
			);

			expect( measurementObserver?.elements.has( row! ) ).toBe( true );
			expect( measurementObserver?.elements.has( item! ) ).toBe( true );
		} );

		it( 'recalculates for item-level size changes and restores on growth', () => {
			availableWidth = 164;
			labelWidths.set( 'Section', 30 );
			const { container } = renderDefaultTrail();
			expect(
				screen.queryByRole( 'button', { name: /hidden breadcrumb/ } )
			).not.toBeInTheDocument();

			labelWidths.set( 'Section', 120 );
			const sectionMetric = Array.from(
				container.querySelectorAll( '.style-measurement-content' )
			).find( ( element ) => element.textContent === 'Section' );
			notifyResize( sectionMetric );
			expect(
				screen.getByRole( 'button', { name: /hidden breadcrumb/ } )
			).toBeInTheDocument();

			availableWidth = 500;
			notifyResize( screen.getByRole( 'navigation' ) );
			expect(
				screen.queryByRole( 'button', { name: /hidden breadcrumb/ } )
			).not.toBeInTheDocument();
		} );

		it( 'recalculates after fonts finish loading', async () => {
			let resolveFonts: () => void;
			const fontsReady = new Promise< void >( ( resolve ) => {
				resolveFonts = resolve;
			} );
			Object.defineProperty( document, 'fonts', {
				configurable: true,
				value: { ready: fontsReady },
			} );
			availableWidth = 100;
			labelWidths.set( 'Home', 20 );
			labelWidths.set( 'Current', 20 );
			render(
				<Breadcrumb.Root>
					<Breadcrumb.LinkItem href="/">Home</Breadcrumb.LinkItem>
					<Breadcrumb.CurrentItem>Current</Breadcrumb.CurrentItem>
				</Breadcrumb.Root>
			);
			expect(
				screen.queryByRole( 'button', { name: /hidden breadcrumb/ } )
			).not.toBeInTheDocument();

			labelWidths.set( 'Home', 100 );
			await act( async () => resolveFonts!() );
			act( flushAnimationFrames );
			expect(
				screen.getByRole( 'button', { name: /hidden breadcrumb/ } )
			).toBeInTheDocument();
		} );

		it( 'coalesces resize notifications into one calculation per frame', () => {
			const { container } = renderDefaultTrail();
			const item = container.querySelector(
				'.style-measurement-content'
			);
			const itemObserver = resizeObservers.find( ( observer ) =>
				observer.elements.has( item! )
			);
			const requestFrame = global.requestAnimationFrame as jest.Mock;
			requestFrame.mockClear();

			act( () => {
				itemObserver?.callback( [], {} as ResizeObserver );
				itemObserver?.callback( [], {} as ResizeObserver );
				itemObserver?.callback( [], {} as ResizeObserver );
			} );

			expect( requestFrame ).toHaveBeenCalledTimes( 1 );
			act( flushAnimationFrames );
		} );

		it( 'disconnects every observer on cleanup', () => {
			const { unmount } = renderDefaultTrail();
			const observersAtMount = [ ...resizeObservers ];

			unmount();
			expect(
				observersAtMount.every( ( observer ) => observer.disconnected )
			).toBe( true );
		} );

		it( 'falls back to the complete semantic trail without ResizeObserver', () => {
			global.ResizeObserver =
				undefined as unknown as typeof ResizeObserver;
			availableWidth = 40;
			renderDefaultTrail();

			expect( screen.getAllByRole( 'link' ) ).toHaveLength( 2 );
			expect(
				screen.queryByRole( 'button', { name: /hidden breadcrumb/ } )
			).not.toBeInTheDocument();
		} );
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
