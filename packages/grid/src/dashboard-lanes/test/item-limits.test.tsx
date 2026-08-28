import { act, fireEvent, render } from '@testing-library/react';
import { DashboardLanes } from '..';
import type { DashboardLanesLayoutItem } from '../types';

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

let originalResizeObserver: typeof ResizeObserver;
let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect;

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

// Six lanes with the fallback 24px gap. `a` stores one lane and
// declares a 60px floor that quantizes to two lanes in both geometries
// below; its rect mirrors that rendered width so the pixel clamp
// measures the tile on screen. A keyboard step is 25px: one lane on
// 44px tracks (240px container), none on 64px tracks (360px container).
const LANES = 6;
const GAP = 24;
let containerRect = rect( 0, 0, 0, 0 );
let itemRects: Record< string, DOMRect > = {};

function setGeometry( containerWidth: number ) {
	const laneWidth = ( containerWidth - ( LANES - 1 ) * GAP ) / LANES;
	containerRect = rect( 0, 0, containerWidth, 600 );
	itemRects = { a: rect( 0, 0, 2 * laneWidth + GAP, 100 ) };
}

// Space picks the handle up, one arrow step moves 25px, Space drops.
// dnd-kit binds its keyboard listener on a timeout after pickup and
// settles the drop through a microtask and timers, so both flushes run
// inside `act`.
async function activateAndStepRight( activator: Element ) {
	fireEvent.keyDown( activator, { code: 'Space' } );
	act( () => {
		jest.runOnlyPendingTimers();
	} );
	fireEvent.keyDown( activator, { code: 'ArrowRight' } );
	fireEvent.keyDown( activator, { code: 'Space' } );
	await act( async () => {
		jest.runOnlyPendingTimers();
	} );
}

beforeEach( () => {
	jest.useFakeTimers();
	originalResizeObserver = global.ResizeObserver;
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		MockResizeObserver;
	originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
	HTMLElement.prototype.getBoundingClientRect = function () {
		// eslint-disable-next-line testing-library/no-node-access
		const key = this.closest( '[data-wp-grid-item-key]' )?.getAttribute(
			'data-wp-grid-item-key'
		);
		return ( key && itemRects[ key ] ) || containerRect;
	};
} );

afterEach( () => {
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		originalResizeObserver;
	HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
	jest.useRealTimers();
} );

function renderLanes( onChangeLayout: jest.Mock ) {
	const layout: DashboardLanesLayoutItem[] = [ { key: 'a', width: 1 } ];
	return render(
		<DashboardLanes
			layout={ layout }
			columns={ LANES }
			itemLimits={ { a: { minWidth: 60 } } }
			editMode
			onChangeLayout={ onChangeLayout }
		>
			<div key="a">A</div>
		</DashboardLanes>
	);
}

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
function getResizeHandle( container: HTMLElement, key: string ) {
	const handle = container.querySelector(
		`[data-wp-grid-item-key="${ key }"] [aria-roledescription="draggable"]`
	);
	expect( handle ).not.toBeNull();
	return handle!;
}

describe( 'DashboardLanes item limits', () => {
	it( 'renders a stored span below the floor lifted to it', () => {
		setGeometry( 240 );
		const { container } = renderLanes( jest.fn() );
		const itemA = container.querySelector( '[data-wp-grid-item-key="a"]' );
		expect( itemA ).toHaveStyle( { gridColumn: 'span 2' } );
	} );

	it( 'resizes from the rendered span, not the stored one', async () => {
		setGeometry( 240 );
		const onChangeLayout = jest.fn();
		const { container } = renderLanes( onChangeLayout );

		// One lane to the right of the rendered two-lane span.
		await activateAndStepRight( getResizeHandle( container, 'a' ) );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		const committed: DashboardLanesLayoutItem[] =
			onChangeLayout.mock.calls[ 0 ][ 0 ];
		expect( committed.find( ( item ) => item.key === 'a' )?.width ).toBe(
			3
		);
	} );

	it( 'commits nothing while the gesture stays inside the rendered span', async () => {
		setGeometry( 360 );
		const onChangeLayout = jest.fn();
		const { container } = renderLanes( onChangeLayout );

		await activateAndStepRight( getResizeHandle( container, 'a' ) );

		expect( onChangeLayout ).not.toHaveBeenCalled();
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
