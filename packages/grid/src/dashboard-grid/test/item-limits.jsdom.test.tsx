import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { DashboardGrid } from '..';
import type { DashboardGridLayoutItem } from '../types';

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

// Container 240px wide, six columns, fallback gap 24px: one column
// track is 20px + 24px gap = 44px. A 60px minimum width quantizes to
// two columns; one keyboard step (25px) rounds to one column.
const CONTAINER_RECT = rect( 0, 0, 240, 600 );

// Tile rects for the sortable keyboard coordinates: `b` sits to the
// right of `a` and is wider, so a step right lands past its center.
const ITEM_RECTS: Record< string, DOMRect > = {
	a: rect( 0, 0, 100, 100 ),
	b: rect( 120, 0, 200, 100 ),
};

// Space picks the handle up, one arrow step moves 25px, Space drops.
// dnd-kit binds its keyboard listener on a timeout after pickup and
// settles the drop through a microtask and timers, so both flushes run
// inside `act`.
async function activateAndStepRight( activator: Element ) {
	fireEvent.keyDown( activator, { code: 'Space' } );
	act( () => {
		vi.runOnlyPendingTimers();
	} );
	fireEvent.keyDown( activator, { code: 'ArrowRight' } );
	fireEvent.keyDown( activator, { code: 'Space' } );
	await act( async () => {
		vi.runOnlyPendingTimers();
	} );
}

beforeEach( () => {
	vi.useFakeTimers();
	vi.stubGlobal( 'ResizeObserver', MockResizeObserver );
	vi.spyOn(
		HTMLElement.prototype,
		'getBoundingClientRect'
	).mockImplementation( function ( this: HTMLElement ) {
		// eslint-disable-next-line testing-library/no-node-access
		const key = this.closest( '[data-wp-grid-item-key]' )?.getAttribute(
			'data-wp-grid-item-key'
		);
		return ( key && ITEM_RECTS[ key ] ) || CONTAINER_RECT;
	} );
} );

afterEach( () => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
} );

function renderGrid(
	onChangeLayout: ( layout: DashboardGridLayoutItem[] ) => void
) {
	const layout: DashboardGridLayoutItem[] = [
		{ key: 'a', width: 1, height: 1 },
		{ key: 'b', width: 1, height: 1 },
	];
	return render(
		<DashboardGrid
			layout={ layout }
			columns={ 6 }
			itemLimits={ { a: { minWidth: 60 } } }
			editMode
			onChangeLayout={ onChangeLayout }
		>
			<div key="a">A</div>
			<div key="b">B</div>
		</DashboardGrid>
	);
}

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
describe( 'DashboardGrid item limits', () => {
	it( 'renders a stored span below the floor lifted to it', () => {
		const { container } = renderGrid( vi.fn() );
		const itemA = container.querySelector< HTMLElement >(
			'[data-wp-grid-item-key="a"]'
		);
		expect( itemA?.style.gridColumnEnd ).toBe( 'span 2' );
	} );

	it( 'resizing another tile leaves the stored span untouched', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { container } = renderGrid( onChangeLayout );
		const handleB = container.querySelector(
			'[data-wp-grid-item-key="b"] [aria-roledescription="draggable"]'
		);
		expect( handleB ).not.toBeNull();

		await activateAndStepRight( handleB! );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		const committed: DashboardGridLayoutItem[] =
			onChangeLayout.mock.calls[ 0 ][ 0 ];
		expect( committed.find( ( item ) => item.key === 'b' )?.width ).toBe(
			2
		);
		expect( committed.find( ( item ) => item.key === 'a' )?.width ).toBe(
			1
		);
	} );

	it( 'reordering leaves the stored span untouched', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { container } = renderGrid( onChangeLayout );
		const activatorA = container.querySelector(
			'[data-wp-grid-item-key="a"] [aria-roledescription="sortable"]'
		);
		expect( activatorA ).not.toBeNull();

		await activateAndStepRight( activatorA! );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		const committed: DashboardGridLayoutItem[] =
			onChangeLayout.mock.calls[ 0 ][ 0 ];
		expect( committed.find( ( item ) => item.key === 'a' )?.order ).toBe(
			1
		);
		expect( committed.find( ( item ) => item.key === 'a' )?.width ).toBe(
			1
		);
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
