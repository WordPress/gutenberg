import { act, fireEvent, render } from '@testing-library/react';
import { DashboardGrid } from '..';
import type { DashboardGridLayoutItem, DashboardGridProps } from '../types';

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
		return ( key && ITEM_RECTS[ key ] ) || CONTAINER_RECT;
	};
} );

afterEach( () => {
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		originalResizeObserver;
	HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
	jest.useRealTimers();
} );

function renderGrid( onChangeLayout: jest.Mock ) {
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
		const { container } = renderGrid( jest.fn() );
		const itemA = container.querySelector( '[data-wp-grid-item-key="a"]' );
		expect( itemA ).toHaveStyle( { gridColumnEnd: 'span 2' } );
	} );

	it( 'resizing another tile leaves the stored span untouched', async () => {
		const onChangeLayout = jest.fn();
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
		const onChangeLayout = jest.fn();
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

describe( 'DashboardGrid resized width semantics', () => {
	function renderResizableItem(
		width: DashboardGridLayoutItem[ 'width' ],
		props: Partial< DashboardGridProps > = {}
	) {
		const onChangeLayout = jest.fn();
		const onPreviewLayout = jest.fn();
		const { container } = render(
			<DashboardGrid
				layout={ [ { key: 'tile', width, height: 1 } ] }
				columns={ 1 }
				rowHeight={ 20 }
				editMode
				onChangeLayout={ onChangeLayout }
				onPreviewLayout={ onPreviewLayout }
				{ ...props }
			>
				<div key="tile">Tile</div>
			</DashboardGrid>
		);
		const handle = container.querySelector(
			'[data-wp-grid-item-key="tile"] [aria-roledescription="draggable"]'
		)!;
		return { handle, onChangeLayout, onPreviewLayout };
	}

	async function resizeWithKeyboard( handle: Element, keys: string[] ) {
		fireEvent.keyDown( handle, { code: 'Space' } );
		act( () => {
			jest.runOnlyPendingTimers();
		} );
		for ( const code of keys ) {
			fireEvent.keyDown( handle, { code } );
			// Deliver each throttled resize before the next key or drop.
			act( () => {
				jest.advanceTimersByTime( 20 );
			} );
		}
		fireEvent.keyDown( handle, { code: 'Space' } );
		await act( async () => {
			jest.runOnlyPendingTimers();
		} );
	}

	it.each( [ 'full', 'fill' ] as const )(
		'preserves %s when only the height changes in one column',
		async ( width ) => {
			const { handle, onChangeLayout } = renderResizableItem( width );

			await resizeWithKeyboard( handle, [ 'ArrowDown' ] );

			expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
			expect( onChangeLayout ).toHaveBeenLastCalledWith( [
				{ key: 'tile', width, height: 2 },
			] );
		}
	);

	it.each( [ 'full', 'fill' ] as const )(
		'does not commit %s when movement stays within the starting span',
		async ( width ) => {
			const { handle, onChangeLayout, onPreviewLayout } =
				renderResizableItem( width, { rowHeight: 300 } );

			await resizeWithKeyboard( handle, [ 'ArrowDown', 'ArrowRight' ] );

			expect( onChangeLayout ).not.toHaveBeenCalled();
			expect( onPreviewLayout ).not.toHaveBeenCalled();
		}
	);

	it.each( [ 'full', 'fill' ] as const )(
		'converts %s to a numeric width after a horizontal span change',
		async ( width ) => {
			const { handle, onChangeLayout } = renderResizableItem( width, {
				columns: 3,
			} );

			// Three columns in 240px have an 88px track including the gap.
			await resizeWithKeyboard( handle, Array( 4 ).fill( 'ArrowLeft' ) );

			expect( onChangeLayout ).toHaveBeenLastCalledWith( [
				{ key: 'tile', width: 2, height: 1 },
			] );
		}
	);

	it.each( [ 'full', 'fill' ] as const )(
		'restores %s when the horizontal resize returns to its starting span',
		async ( width ) => {
			const { handle, onChangeLayout, onPreviewLayout } =
				renderResizableItem( width, { columns: 3 } );

			await resizeWithKeyboard( handle, [
				...Array( 4 ).fill( 'ArrowLeft' ),
				...Array( 4 ).fill( 'ArrowRight' ),
			] );

			expect( onPreviewLayout ).toHaveBeenCalledWith( [
				{ key: 'tile', width: 2, height: 1 },
			] );
			expect( onChangeLayout ).toHaveBeenLastCalledWith( [
				{ key: 'tile', width, height: 1 },
			] );
		}
	);

	it( 'commits the rendered numeric width when height changes', async () => {
		const { handle, onChangeLayout } = renderResizableItem( 4 );

		await resizeWithKeyboard( handle, [ 'ArrowDown' ] );

		expect( onChangeLayout ).toHaveBeenLastCalledWith( [
			{ key: 'tile', width: 1, height: 2 },
		] );
	} );

	it( 'preserves full when height changes at a maximum width limit', async () => {
		const { handle, onChangeLayout } = renderResizableItem( 'full', {
			columns: 3,
			itemLimits: { tile: { maxWidth: 80 } },
		} );

		await resizeWithKeyboard( handle, [ 'ArrowDown' ] );

		expect( onChangeLayout ).toHaveBeenLastCalledWith( [
			{ key: 'tile', width: 'full', height: 2 },
		] );
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
