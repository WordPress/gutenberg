/**
 * Regression test for the stale overflow fade: a tab reflowing to fit — with
 * no resize/mutation/scroll event on the list — must clear the fade.
 *
 * The fix mirrors Base UI by observing each tab (not just the list box), so
 * firing only the observers that watch a tab reproduces the exact case the old
 * list-only observer missed. Passes with the fix; fails without it.
 */
import { act, render, screen } from '@testing-library/react';
import { Tabs } from '../..';

// The jest preset mocks CSS Modules to `{}`; expose the keys so we can assert
// on `is-overflowing-last`, the class that drives the fade.
jest.mock( '../style.module.css', () => ( {
	__esModule: true,
	default: new Proxy( {}, { get: ( _target, key ) => key } ),
} ) );

// The list's fixed visible width. The overflowing width exceeds it by more than
// the component's 1px SCROLL_EPSILON so overflow registers; the fitting width
// equals it so the fade clears. The exact pixel values are arbitrary.
const CLIENT_WIDTH = 173;
const OVERFLOWING_SCROLL_WIDTH = CLIENT_WIDTH + 2;
const FITTING_SCROLL_WIDTH = CLIENT_WIDTH;

describe( 'Tabs.List overflow fade', () => {
	let observers: Array< {
		callback: ResizeObserverCallback;
		elements: Set< Element >;
	} >;
	let scrollWidth: number;

	beforeEach( () => {
		observers = [];
		global.ResizeObserver = class {
			elements = new Set< Element >();
			constructor( callback: ResizeObserverCallback ) {
				observers.push( { callback, elements: this.elements } );
			}
			observe( element: Element ) {
				this.elements.add( element );
			}
			unobserve( element: Element ) {
				this.elements.delete( element );
			}
			disconnect() {
				this.elements.clear();
			}
		} as unknown as typeof ResizeObserver;

		// jsdom does no layout, so drive the measured widths ourselves.
		scrollWidth = OVERFLOWING_SCROLL_WIDTH;
		Object.defineProperty( HTMLElement.prototype, 'scrollWidth', {
			configurable: true,
			get: () => scrollWidth,
		} );
		Object.defineProperty( HTMLElement.prototype, 'clientWidth', {
			configurable: true,
			get: () => CLIENT_WIDTH,
		} );
	} );

	it( 'clears the fade when a tab reflows to fit', () => {
		render(
			<Tabs.Root defaultValue="one">
				<Tabs.List>
					<Tabs.Tab value="one">One</Tabs.Tab>
					<Tabs.Tab value="two">Two</Tabs.Tab>
				</Tabs.List>
			</Tabs.Root>
		);

		const tablist = screen.getByRole( 'tablist' );
		const tabs = screen.getAllByRole( 'tab' );
		expect( tablist ).toHaveClass( 'is-overflowing-last' );

		// Fire only the observers watching a tab — a tab-box reflow, the case the
		// old list-only observer never saw.
		const tabObservers = observers.filter( ( observer ) =>
			tabs.some( ( tab ) => observer.elements.has( tab ) )
		);
		scrollWidth = FITTING_SCROLL_WIDTH;
		act( () =>
			tabObservers.forEach( ( observer ) =>
				observer.callback( [], {} as ResizeObserver )
			)
		);

		expect( tablist ).not.toHaveClass( 'is-overflowing-last' );
	} );
} );
