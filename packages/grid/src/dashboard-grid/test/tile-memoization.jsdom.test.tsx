import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { memo } from '@wordpress/element';
import { DashboardGrid } from '..';
import type { DashboardGridLayoutItem, GridItemProps } from '../types';

// Counts how many times the real `GridItem` implementation actually runs,
// keyed by item. Re-wrapping the unmemoized implementation (`memo()`'s
// `.type`) in `memo()` again preserves the exact bailout semantics the
// production export uses, so a count that grows across gesture frames
// means something legitimately changed for that tile, not that the mock
// bypassed memoization.
let renderCounts: Record< string, number > = {};

vi.mock( '../grid-item', async ( importOriginal ) => {
	const actual = await importOriginal< typeof import( '../grid-item' ) >();
	const Impl = (
		actual.GridItem as unknown as {
			type: ( props: GridItemProps ) => JSX.Element;
		}
	 ).type;
	const countingImpl = ( props: GridItemProps ) => {
		renderCounts[ props.item.key ] =
			( renderCounts[ props.item.key ] ?? 0 ) + 1;
		return Impl( props );
	};
	return { ...actual, GridItem: memo( countingImpl ) };
} );

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

function rect( left: number, top: number, width: number, height: number ) {
	return {
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top,
		toJSON() {},
	} as DOMRect;
}

// 126px container, six columns, fallback gap 24px: one column track is
// 1px + 24px gap = 25px, exactly one keyboard step. Every `ArrowRight`
// therefore grows the active tile by precisely one column with no
// rounding ties between steps.
const CONTAINER_RECT = rect( 0, 0, 126, 600 );

const FILL_COUNT = 20;
const FILL_KEYS = Array.from(
	{ length: FILL_COUNT },
	( _, i ) => `fill-${ i }`
);

beforeEach( () => {
	renderCounts = {};
	vi.useFakeTimers();
	vi.stubGlobal( 'ResizeObserver', MockResizeObserver );
	vi.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockReturnValue(
		CONTAINER_RECT
	);
} );

afterEach( () => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
} );

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
describe( 'DashboardGrid tile memoization', () => {
	it( "reuses untouched fill tiles' resolved item objects on a resize frame", async () => {
		// `fill-*` tiles share no row with `active`, so their resolved
		// span never depends on it (see `resolveFillWidths`'s single-row
		// path). Before the fix, `resolvedItemMap` rebuilt every 'fill'
		// item's object on each frame, defeating `memo()`. Each `fill-*`
		// tile should re-render once here, for the gesture-wide
		// `interacting` flip, not once per frame.
		const layout: DashboardGridLayoutItem[] = [
			...FILL_KEYS.map( ( key ): DashboardGridLayoutItem => ( {
				key,
				width: 'fill',
			} ) ),
			{ key: 'active', width: 2 },
		];

		const { container } = render(
			<DashboardGrid layout={ layout } columns={ 6 } editMode>
				{ [
					...FILL_KEYS.map( ( key ) => (
						<div key={ key }>{ key }</div>
					) ),
					<div key="active">active</div>,
				] }
			</DashboardGrid>
		);

		const handle = container.querySelector(
			'[data-wp-grid-item-key="active"] [aria-roledescription="draggable"]'
		);
		expect( handle ).not.toBeNull();

		// Let the mount-time layout effects (container measurement,
		// gap read-back) settle before taking a baseline. How many
		// passes that takes is an implementation detail unrelated to
		// this test; only the *gesture* frames matter below.
		act( () => {
			vi.runOnlyPendingTimers();
		} );
		const baseline = { ...renderCounts };

		// Pick up the resize handle and take the first step. This is
		// the gesture's first frame: the surface's `isResizing` flips,
		// so every tile's `interacting` prop flips too and every tile
		// legitimately re-renders once more.
		fireEvent.keyDown( handle!, { code: 'Space' } );
		act( () => {
			vi.runOnlyPendingTimers();
		} );
		fireEvent.keyDown( handle!, { code: 'ArrowRight' } );
		act( () => {
			vi.advanceTimersByTime( 20 );
		} );

		const afterFirstStep = { ...renderCounts };
		expect( afterFirstStep.active ).toBeGreaterThan( baseline.active );
		for ( const key of FILL_KEYS ) {
			expect( afterFirstStep[ key ] ).toBe( baseline[ key ] + 1 );
		}

		fireEvent.keyDown( handle!, { code: 'Space' } );
		await act( async () => {
			vi.runOnlyPendingTimers();
		} );
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
