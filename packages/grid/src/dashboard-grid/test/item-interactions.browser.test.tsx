import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { DashboardGrid } from '..';

async function renderItem( flags: {
	draggable?: boolean;
	resizable?: boolean;
} ) {
	const { container } = await render(
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

describe( 'DashboardGrid item interactions', () => {
	it( 'drags and resizes by default in edit mode', async () => {
		const { activator, resizeHandle } = await renderItem( {} );
		expect( activator ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( resizeHandle ).not.toBeNull();
	} );

	it( 'keeps an item in place when draggable is false', async () => {
		const { activator, resizeHandle } = await renderItem( {
			draggable: false,
		} );
		expect( activator ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( resizeHandle ).not.toBeNull();
	} );

	it( 'keeps an item at its size when resizable is false', async () => {
		const { activator, resizeHandle } = await renderItem( {
			resizable: false,
		} );
		expect( activator ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( resizeHandle ).toBeNull();
	} );
} );
