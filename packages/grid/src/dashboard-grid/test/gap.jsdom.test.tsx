import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import type { GapSize } from '@wordpress/theme';
import { DashboardGrid } from '..';
import type { DashboardGridLayoutItem } from '../types';

// Observer callbacks keyed by the element each observes, so a test can
// deliver a resize to the grid root.
const observers = new Map< Element, ResizeObserverCallback >();

class MockResizeObserver {
	callback: ResizeObserverCallback;
	constructor( callback: ResizeObserverCallback ) {
		this.callback = callback;
	}
	observe( element: Element ) {
		observers.set( element, this.callback );
	}
	unobserve( element: Element ) {
		observers.delete( element );
	}
	disconnect() {}
}

// A 240px container with a 100px floor fits two columns on a 24px gap
// (264 / 124) and one on a 48px gap (288 / 148).
const CONTAINER_WIDTH = 240;
let computedGap = '24px';

const layout: DashboardGridLayoutItem[] = [
	{ key: 'a', width: 1 },
	{ key: 'b', width: 1 },
];

beforeEach( () => {
	vi.stubGlobal( 'ResizeObserver', MockResizeObserver );
	vi.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockReturnValue(
		{
			left: 0,
			top: 0,
			width: CONTAINER_WIDTH,
			height: 600,
			right: CONTAINER_WIDTH,
			bottom: 600,
			x: 0,
			y: 0,
			toJSON() {},
		} as DOMRect
	);
	// jsdom resolves no `var()`, so the computed `column-gap` the surface
	// reads is answered here; the rest of the declaration stays real.
	const getComputedStyle = window.getComputedStyle.bind( window );
	vi.spyOn( window, 'getComputedStyle' ).mockImplementation(
		( element, pseudo ) =>
			new Proxy( getComputedStyle( element, pseudo ), {
				get( declaration, property ) {
					if ( property === 'columnGap' ) {
						return computedGap;
					}
					const value = Reflect.get( declaration, property );
					return typeof value === 'function'
						? value.bind( declaration )
						: value;
				},
			} )
	);
} );

afterEach( () => {
	observers.clear();
	computedGap = '24px';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
} );

/* eslint-disable testing-library/no-container */
function renderGrid( gap?: GapSize ): { root: HTMLElement } {
	const { container } = render(
		<DashboardGrid layout={ layout } minColumnWidth={ 100 } gap={ gap }>
			<div key="a">A</div>
			<div key="b">B</div>
		</DashboardGrid>
	);
	return {
		root: container.querySelector< HTMLElement >(
			'[data-wp-grid-item-key="a"]'
		)!.parentElement!,
	};
}
/* eslint-enable testing-library/no-container */

function resize( root: HTMLElement ) {
	const deliver = observers.get( root );
	expect( deliver ).toBeDefined();
	act( () => {
		deliver!(
			[
				{
					target: root,
					contentRect: { width: CONTAINER_WIDTH, height: 600 },
				} as unknown as ResizeObserverEntry,
			],
			{} as ResizeObserver
		);
	} );
}

describe( 'DashboardGrid gap', () => {
	it( 'writes the step token to the root for the stylesheet to resolve', () => {
		const { root } = renderGrid( 'md' );
		expect( root.style.getPropertyValue( '--wp-grid-gap' ) ).toBe(
			'var(--wpds-dimension-gap-md)'
		);
	} );

	it( 'writes nothing for an absent or unknown step', () => {
		const { root: absent } = renderGrid();
		expect( absent.style.getPropertyValue( '--wp-grid-gap' ) ).toBe( '' );
		const { root: unknown } = renderGrid( 'huge' as GapSize );
		expect( unknown.style.getPropertyValue( '--wp-grid-gap' ) ).toBe( '' );
	} );

	it( 'fits the columns with the computed gap and reads it again on resize', () => {
		const { root } = renderGrid( 'xl' );
		expect( root ).toHaveStyle( {
			gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		} );

		computedGap = '48px';
		resize( root );
		expect( root ).toHaveStyle( {
			gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
		} );
	} );
} );
