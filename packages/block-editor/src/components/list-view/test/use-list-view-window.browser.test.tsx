import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import useListViewWindow from '../use-list-view-window';
import { BLOCK_LIST_ITEM_HEIGHT } from '../utils';

const rows = Array.from( { length: 200 }, ( _, index ) => index );

function List() {
	const { ref, fixedListWindow } = useListViewWindow();
	const { start, end } = fixedListWindow;
	return (
		<div ref={ ref }>
			{ rows.map( ( index ) => (
				<div key={ index } style={ { height: BLOCK_LIST_ITEM_HEIGHT } }>
					{ index >= start && index < end
						? `Row ${ index + 1 }`
						: null }
				</div>
			) ) }
		</div>
	);
}

// Lets pending scroll events and observer reports from the setup run, so
// that they can't stand in for the update a test is about.
const settle = () =>
	new Promise( ( resolve ) =>
		requestAnimationFrame( () => requestAnimationFrame( resolve ) )
	);

async function renderInPanel() {
	const screen = await render(
		<div
			data-testid="panel"
			style={ {
				position: 'fixed',
				top: 0,
				width: 320,
				overflow: 'auto',
			} }
		>
			<List />
		</div>
	);
	return { screen, panel: screen.getByTestId( 'panel' ).element() };
}

describe( 'useListViewWindow', () => {
	it( 'fills a panel that grows without a window resize', async () => {
		const { screen, panel } = await renderInPanel();
		panel.style.maxHeight = '200px';
		panel.scrollTop = 3000;
		await expect
			.element( screen.getByText( 'Row 95', { exact: true } ) )
			.toBeVisible();
		await settle();

		panel.style.maxHeight = '3200px';

		await expect
			.element( screen.getByText( 'Row 190', { exact: true } ) )
			.toBeVisible();
	} );

	it( 'shows the rows in a dropdown opened far down a scrolled page', async () => {
		await render( <div style={ { height: '400vh' } } /> );
		window.scrollTo( 0, 2 * window.innerHeight );
		const { screen, panel } = await renderInPanel();
		await settle();
		// A popover only starts to clip its content after the first layout.
		panel.style.maxHeight = '320px';
		await settle();
		expect(
			screen.getByText( 'Row 100', { exact: true } ).query()
		).toBeNull();

		panel.scrollTop = 3000;

		await expect
			.element( screen.getByText( 'Row 100', { exact: true } ) )
			.toBeVisible();
	} );
} );
