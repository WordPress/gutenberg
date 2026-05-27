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
		// Verifies the DOM hierarchy: keyboard activation needs the
		// focused node and the keydown listener to share a node, so
		// the activator must live nested inside the outer item.
		/* eslint-disable testing-library/no-container, testing-library/no-node-access */
		const { container } = render(
			<DashboardLanes layout={ [ { key: 'a' } ] } columns={ 2 } editMode>
				<div key="a">A</div>
			</DashboardLanes>
		);

		// Edit mode also renders a resize handle with `role="button"`;
		// `aria-roledescription="sortable"` isolates the activator.
		const activator = container.querySelector(
			'[role="button"][aria-roledescription="sortable"]'
		);
		expect( activator ).not.toBeNull();
		expect( activator ).toHaveAttribute( 'tabindex', '0' );

		// Outer item is identified by `data-wp-grid-item-key`; the activator
		// must be its descendant.
		const lanesItem = container.querySelector(
			'[data-wp-grid-item-key="a"]'
		);
		expect( lanesItem ).not.toBeNull();
		expect( activator ).not.toBe( lanesItem );
		expect( lanesItem!.contains( activator! ) ).toBe( true );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
	} );
} );
