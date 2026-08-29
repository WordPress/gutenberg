import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { DashboardGrid } from '..';

describe( 'DashboardGrid keyboard activation', () => {
	it( 'places the dnd-kit keyboard activator on the inner wrapper, not the outer item', async () => {
		// Verifies the DOM hierarchy: keyboard activation needs the
		// focused node and the keydown listener to share a node, so
		// the activator must live nested inside the outer item.
		const { container } = await render(
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

		await userEvent.tab();
		expect( activator ).toHaveFocus();
		await userEvent.keyboard( '[Space]' );
		expect( activator ).toHaveAttribute( 'aria-pressed', 'true' );
		await userEvent.keyboard( '[Escape]' );
		expect( activator ).not.toHaveAttribute( 'aria-pressed' );
	} );
} );
