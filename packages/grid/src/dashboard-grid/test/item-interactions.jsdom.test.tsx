import { render } from '@testing-library/react';
import { DashboardGrid } from '..';

class MockResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
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

/* eslint-disable testing-library/no-container */
function renderItem( flags: { draggable?: boolean; resizable?: boolean } ) {
	const { container } = render(
		<DashboardGrid
			layout={ [ { key: 'a', width: 1, ...flags } ] }
			columns={ 2 }
			editMode
		>
			<div key="a">A</div>
		</DashboardGrid>
	);
	return {
		activator: container.querySelector(
			'[aria-roledescription="sortable"]'
		),
		resizeHandle: container.querySelector(
			'[aria-roledescription="draggable"]'
		),
	};
}
/* eslint-enable testing-library/no-container */

describe( 'DashboardGrid item interactions', () => {
	it( 'drags and resizes by default in edit mode', () => {
		const { activator, resizeHandle } = renderItem( {} );
		expect( activator ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( resizeHandle ).not.toBeNull();
	} );

	it( 'keeps an item in place when draggable is false', () => {
		const { activator, resizeHandle } = renderItem( { draggable: false } );
		expect( activator ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( resizeHandle ).not.toBeNull();
	} );

	it( 'keeps an item at its size when resizable is false', () => {
		const { activator, resizeHandle } = renderItem( { resizable: false } );
		expect( activator ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( resizeHandle ).toBeNull();
	} );
} );
