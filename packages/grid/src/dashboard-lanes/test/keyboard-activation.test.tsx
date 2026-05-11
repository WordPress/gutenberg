/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { DashboardLanes } from '..';

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
	originalResizeObserver = global.ResizeObserver;
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		MockResizeObserver;
} );

afterEach( () => {
	( global as unknown as { ResizeObserver: unknown } ).ResizeObserver =
		originalResizeObserver;
} );

describe( 'DashboardLanes keyboard activation', () => {
	it( 'places the dnd-kit keyboard activator on the inner wrapper, not the outer item', () => {
		// dnd-kit's `useSortable` spreads `attributes` (with `role`,
		// `tabIndex`, `aria-*`) on whatever element should receive
		// focus, and `listeners` (with `onKeyDown`) on the element
		// that should observe key events. Both must live on the same
		// node for keyboard activation to fire: focus on outer + key
		// listener on inner would never wire up because React events
		// bubble up from the target, not down.
		//
		// This test asserts the DOM hierarchy that makes the wiring
		// work, so it uses container queries and node traversal
		// rather than role/text queries (testing-library's default).
		/* eslint-disable testing-library/no-container, testing-library/no-node-access */
		const { container } = render(
			<DashboardLanes layout={ [ { key: 'a' } ] } columns={ 2 } editMode>
				<div key="a">A</div>
			</DashboardLanes>
		);

		// Edit mode also mounts a resize handle that dnd-kit decorates
		// with `role="button"`; filter by `aria-roledescription="sortable"`
		// so we land on the sortable activator specifically (the resize
		// handle is `aria-roledescription="draggable"`).
		const activator = container.querySelector(
			'[role="button"][aria-roledescription="sortable"]'
		);
		expect( activator ).not.toBeNull();
		expect( activator ).toHaveAttribute( 'tabindex', '0' );

		// Locate the outer lanes item via the placement marker
		// `useLanePlacement` reads. The activator wrapper must be a
		// strict descendant of that node; if a future change moves
		// attributes back onto the outer, `role="button"` would land
		// on the same node as `data-lanes-key` and this assertion
		// would fail.
		const lanesItem = container.querySelector( '[data-lanes-key="a"]' );
		expect( lanesItem ).not.toBeNull();
		expect( activator ).not.toBe( lanesItem );
		expect( lanesItem!.contains( activator! ) ).toBe( true );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
	} );
} );
