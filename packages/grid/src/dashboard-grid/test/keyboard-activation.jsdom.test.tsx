import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardGrid } from '..';

class MockResizeObserver {
	observed: Set< Element > = new Set();
	observe( element: Element ) {
		this.observed.add( element );
	}
	unobserve( element: Element ) {
		this.observed.delete( element );
	}
	disconnect() {
		this.observed.clear();
	}
}

let originalResizeObserver: typeof ResizeObserver;

beforeEach( () => {
	originalResizeObserver = globalThis.ResizeObserver;
	( globalThis as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		MockResizeObserver;
} );

afterEach( () => {
	( globalThis as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		originalResizeObserver;
} );

describe( 'DashboardGrid keyboard activation', () => {
	it( 'places the dnd-kit keyboard activator on the inner wrapper, not the outer item', () => {
		// Verifies the DOM hierarchy: keyboard activation needs the
		// focused node and the keydown listener to share a node, so
		// the activator must live nested inside the outer item.
		/* eslint-disable testing-library/no-container, testing-library/no-node-access */
		const { container } = render(
			<DashboardGrid
				layout={ [ { key: 'a', width: 1 } ] }
				columns={ 2 }
				editMode
			>
				<div key="a">A</div>
			</DashboardGrid>
		);

		// Edit mode also renders a resize handle with `role="button"`;
		// `aria-roledescription="sortable"` isolates the activator.
		const activator = container.querySelector(
			'[role="button"][aria-roledescription="sortable"]'
		);
		expect( activator ).not.toBeNull();
		expect( activator ).toHaveAttribute( 'tabindex', '0' );

		// Outer item is identified by its inline `grid-column-end`
		// placement style; the activator must be its descendant.
		const items = container.querySelectorAll(
			'[style*="grid-column-end"]'
		);
		expect( items ).toHaveLength( 1 );
		const item = items[ 0 ];
		expect( activator ).not.toBe( item );
		expect( item.contains( activator! ) ).toBe( true );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
	} );
} );

/* eslint-disable testing-library/no-container, testing-library/no-node-access */
describe( 'DashboardGrid keyboard reordering', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		// jsdom has no layout. Measure the surface separately from the
		// equal-sized tiles and drag overlay, keeping real dnd-kit sensors.
		vi.spyOn(
			HTMLElement.prototype,
			'getBoundingClientRect'
		).mockImplementation( function ( this: HTMLElement ) {
			const key = this.closest( '[data-wp-grid-item-key]' )?.getAttribute(
				'data-wp-grid-item-key'
			);
			// dnd-kit measures the overlay's child, which inherits the fixed
			// wrapper's starting position rather than an item's DOM ancestry.
			const overlay = this.closest< HTMLElement >(
				'[style*="position: fixed"]'
			);
			let left = key ? [ 'a', 'b', 'c' ].indexOf( key ) * 124 : 0;
			if ( overlay ) {
				left = parseFloat( overlay.style.left );
			}
			const width =
				this.getAttribute( 'data-testid' ) === 'surface' ? 348 : 100;
			return {
				x: left,
				y: 0,
				left,
				top: 0,
				width,
				height: 100,
				right: left + width,
				bottom: 100,
				toJSON() {},
			} as DOMRect;
		} );
	} );

	afterEach( () => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	} );

	it.each( [
		{
			name: 'moves one position right',
			key: 'a',
			moves: [ 'ArrowRight' ],
			order: [ 1, 0, 2 ],
		},
		{
			name: 'moves one position left',
			key: 'c',
			moves: [ 'ArrowLeft' ],
			order: [ 0, 2, 1 ],
		},
		{
			name: 'commits the final target after multiple steps',
			key: 'a',
			moves: [ 'ArrowRight', 'ArrowRight' ],
			order: [ 2, 0, 1 ],
		},
		{
			name: 'keeps pinned items in place',
			key: 'a',
			// Pinned B remains a drop target, so cross it to reach C.
			moves: [ 'ArrowRight', 'ArrowRight' ],
			pinned: true,
			order: [ 2, 1, 0 ],
		},
		{
			name: 'discards a cancelled move',
			key: 'a',
			moves: [ 'ArrowRight' ],
			cancel: true,
		},
		{
			name: 'does not commit a move back to its starting position',
			key: 'a',
			moves: [ 'ArrowRight', 'ArrowLeft' ],
		},
		{
			name: 'does not commit when dropped without moving',
			key: 'a',
			moves: [],
		},
		{
			name: 'does not move beyond the first item',
			key: 'a',
			moves: [ 'ArrowLeft' ],
		},
	] )( '$name', async ( { key, moves, order, pinned, cancel } ) => {
		const onChangeLayout = vi.fn();
		const onPreviewLayout = vi.fn();
		const layout = [
			{ key: 'a', width: 1 },
			{ key: 'b', width: 1, ...( pinned ? { draggable: false } : {} ) },
			{ key: 'c', width: 1 },
		];
		const { container } = render(
			<DashboardGrid
				layout={ layout }
				columns={ 3 }
				data-testid="surface"
				editMode
				onChangeLayout={ onChangeLayout }
				onPreviewLayout={ onPreviewLayout }
			>
				<div key="a">A</div>
				<div key="b">B</div>
				<div key="c">C</div>
			</DashboardGrid>
		);
		const activator = container.querySelector(
			`[data-wp-grid-item-key="${ key }"] [aria-roledescription="sortable"]`
		);
		expect( activator ).not.toBeNull();
		fireEvent.keyDown( activator!, { code: 'Space' } );
		// dnd-kit attaches its keyboard listener on the next timer tick.
		act( () => {
			vi.runOnlyPendingTimers();
		} );
		for ( const code of moves ) {
			fireEvent.keyDown( activator!, { code } );
		}
		fireEvent.keyDown( activator!, { code: cancel ? 'Escape' : 'Space' } );
		await act( async () => {
			vi.runOnlyPendingTimers();
		} );

		const expectedCalls = order
			? [
					[
						layout.map( ( item, index ) => ( {
							...item,
							order: order[ index ],
						} ) ),
					],
			  ]
			: [];
		expect( onChangeLayout.mock.calls ).toEqual( expectedCalls );
		expect( onPreviewLayout ).not.toHaveBeenCalled();
	} );
} );
/* eslint-enable testing-library/no-container, testing-library/no-node-access */
