import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { DashboardGrid } from '..';
import type {
	DashboardGridItemResizeWidths,
	DashboardGridLayoutItem,
} from '../types';

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}

// jsdom has no PointerEvent; dnd-kit's PointerSensor reads `isPrimary`,
// `button`, and the client coordinates off the native event.
class MockPointerEvent extends MouseEvent {
	pointerId: number;
	pointerType: string;
	isPrimary: boolean;

	constructor( type: string, init: PointerEventInit = {} ) {
		super( type, init );
		this.pointerId = init.pointerId ?? 1;
		this.pointerType = init.pointerType ?? 'mouse';
		this.isPrimary = init.isPrimary ?? true;
	}
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

// Container 240px wide with the fallback 24px gap. At six columns one
// track is 20px + 24px gap = 44px, so one 25px keyboard step rounds to a
// column; at two columns the track is 108px + 24px gap = 132px, so three
// steps round to one column.
const CONTAINER_RECT = rect( 0, 0, 240, 600 );
const ITEM_RECT = rect( 0, 0, 100, 100 );

function pointerEvent(
	type: string,
	init: PointerEventInit
): MockPointerEvent {
	return new MockPointerEvent( type, {
		bubbles: true,
		cancelable: true,
		pointerId: 1,
		isPrimary: true,
		pointerType: 'mouse',
		...init,
	} );
}

function resizeWithPointer( handle: Element, delta: { x: number; y: number } ) {
	const start = { x: 50, y: 50 };
	const end = { x: start.x + delta.x, y: start.y + delta.y };
	act( () => {
		handle.dispatchEvent(
			pointerEvent( 'pointerdown', {
				clientX: start.x,
				clientY: start.y,
				button: 0,
				buttons: 1,
			} )
		);
	} );
	act( () => {
		document.dispatchEvent(
			pointerEvent( 'pointermove', {
				clientX: end.x,
				clientY: end.y,
			} )
		);
	} );
	act( () => {
		document.dispatchEvent(
			pointerEvent( 'pointerup', {
				clientX: end.x,
				clientY: end.y,
			} )
		);
	} );
}

// Space picks the handle up, the arrow keys move the pointer in 25px
// steps, Space drops. dnd-kit binds its keyboard listener after a
// timeout and settles the drop through timers, so both flushes run
// inside `act`.
async function resizeWithKeyboard( handle: Element, keys: string[] ) {
	fireEvent.keyDown( handle, { code: 'Space' } );
	act( () => {
		vi.runOnlyPendingTimers();
	} );
	for ( const key of keys ) {
		fireEvent.keyDown( handle, { code: key } );
	}
	fireEvent.keyDown( handle, { code: 'Space' } );
	await act( async () => {
		vi.runOnlyPendingTimers();
	} );
}

beforeEach( () => {
	vi.useFakeTimers();
	vi.stubGlobal( 'ResizeObserver', MockResizeObserver );
	vi.stubGlobal( 'PointerEvent', MockPointerEvent );
	vi.spyOn(
		HTMLElement.prototype,
		'getBoundingClientRect'
	).mockImplementation( function ( this: HTMLElement ) {
		// eslint-disable-next-line testing-library/no-node-access
		const key = this.closest( '[data-wp-grid-item-key]' )?.getAttribute(
			'data-wp-grid-item-key'
		);
		return key ? ITEM_RECT : CONTAINER_RECT;
	} );
} );

afterEach( () => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
} );

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
function renderGrid( {
	columns = 6,
	rowHeight = 300,
	itemResizeWidths,
	layout = [ { key: 'a', width: 1, height: 1 } ],
	onChangeLayout,
}: {
	columns?: number;
	rowHeight?: number;
	itemResizeWidths?: DashboardGridItemResizeWidths;
	layout?: DashboardGridLayoutItem[];
	onChangeLayout: ( layout: DashboardGridLayoutItem[] ) => void;
} ) {
	const { container } = render(
		<DashboardGrid
			layout={ layout }
			columns={ columns }
			rowHeight={ rowHeight }
			itemResizeWidths={ itemResizeWidths }
			editMode
			onChangeLayout={ onChangeLayout }
		>
			{ layout.map( ( item ) => (
				<div key={ item.key }>{ item.key }</div>
			) ) }
		</DashboardGrid>
	);
	const handle = container.querySelector(
		'[data-wp-grid-item-key="a"] [aria-roledescription="draggable"]'
	);
	expect( handle ).not.toBeNull();
	return { container, handle: handle as Element };
}

function committedWidth(
	onChangeLayout: ReturnType< typeof vi.fn >
): DashboardGridLayoutItem[ 'width' ] {
	const committed: DashboardGridLayoutItem[] =
		onChangeLayout.mock.calls[ 0 ][ 0 ];
	return committed.find( ( item ) => item.key === 'a' )?.width;
}

describe( 'DashboardGrid item resize widths', () => {
	it( 'keeps whole-column snapping when an item has no entry', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( { onChangeLayout } );

		await resizeWithKeyboard( handle, [ 'ArrowRight' ] );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		expect( committedWidth( onChangeLayout ) ).toBe( 2 );
	} );

	it( 'commits a listed numeric token instead of the raw column span', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			itemResizeWidths: { a: [ 3 ] },
			onChangeLayout,
		} );

		await resizeWithKeyboard( handle, [
			'ArrowRight',
			'ArrowRight',
			'ArrowRight',
		] );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		expect( committedWidth( onChangeLayout ) ).toBe( 3 );
	} );

	it( 'commits the named `full` token when the pointer reaches it', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			itemResizeWidths: { a: [ 1, 'full' ] },
			onChangeLayout,
		} );

		await resizeWithKeyboard(
			handle,
			Array.from( { length: 8 }, () => 'ArrowRight' )
		);

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		expect( committedWidth( onChangeLayout ) ).toBe( 'full' );
	} );

	it( 'freezes the width but still resizes the height with an empty entry', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			rowHeight: 20,
			itemResizeWidths: { a: [] },
			onChangeLayout,
		} );

		await resizeWithKeyboard( handle, [
			'ArrowRight',
			'ArrowRight',
			'ArrowRight',
			'ArrowDown',
		] );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		const [ committed ] = onChangeLayout.mock.calls[ 0 ];
		const item = committed.find( ( entry ) => entry.key === 'a' );
		expect( item?.width ).toBe( 1 );
		expect( item?.height ).toBe( 2 );
	} );

	it( 'keeps the stored token when a narrow container leaves choices looking identical', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			columns: 1,
			rowHeight: 20,
			itemResizeWidths: { a: [ 1, 'full' ] },
			onChangeLayout,
		} );

		await resizeWithKeyboard( handle, [
			'ArrowRight',
			'ArrowRight',
			'ArrowRight',
		] );

		// The horizontal span cannot change, so nothing is committed and
		// the token stays as stored.
		expect( onChangeLayout ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ [ 2, 'full' ] as const, 2 ],
		[ [ 'full', 2 ] as const, 'full' ],
	] )(
		'prefers the declared order when choices resolve to the same span (%j)',
		async ( tokens, expected ) => {
			const onChangeLayout =
				vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
			const { handle } = renderGrid( {
				columns: 2,
				itemResizeWidths: { a: [ ...tokens ] },
				onChangeLayout,
			} );

			await resizeWithKeyboard( handle, [
				'ArrowRight',
				'ArrowRight',
				'ArrowRight',
			] );

			expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
			expect( committedWidth( onChangeLayout ) ).toBe( expected );
		}
	);

	it( 'snaps a pointer resize to a declared token', () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			itemResizeWidths: { a: [ 'full' ] },
			onChangeLayout,
		} );

		resizeWithPointer( handle, { x: 200, y: 0 } );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		expect( committedWidth( onChangeLayout ) ).toBe( 'full' );
	} );

	it( 'freezes the width during a pointer resize with an empty entry', () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			rowHeight: 20,
			itemResizeWidths: { a: [] },
			onChangeLayout,
		} );

		resizeWithPointer( handle, { x: 200, y: 60 } );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		const [ committed ] = onChangeLayout.mock.calls[ 0 ];
		const item = committed.find( ( entry ) => entry.key === 'a' );
		expect( item?.width ).toBe( 1 );
		expect( item?.height ).toBe( 2 );
	} );

	it( 'retains a stored token outside the choices until the pointer moves it', async () => {
		const onChangeLayout =
			vi.fn< ( layout: DashboardGridLayoutItem[] ) => void >();
		const { handle } = renderGrid( {
			layout: [ { key: 'a', width: 'fill', height: 1 } ],
			itemResizeWidths: { a: [ 2, 'full' ] },
			onChangeLayout,
			rowHeight: 20,
		} );

		await resizeWithKeyboard( handle, [ 'ArrowDown' ] );

		expect( onChangeLayout ).toHaveBeenCalledTimes( 1 );
		const [ committed ] = onChangeLayout.mock.calls[ 0 ];
		const item = committed.find( ( entry ) => entry.key === 'a' );
		expect( item?.width ).toBe( 'fill' );
		expect( item?.height ).toBe( 2 );
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
