import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import QueryControls from '..';

describe( 'QueryControls order by', () => {
	it.each( [
		[ 'missing', undefined ],
		[ 'unavailable', 'menu_order' ],
	] as const )(
		'shows the placeholder when the sort is %s',
		async ( _, orderBy ) => {
			await render(
				<QueryControls
					order="desc"
					orderBy={ orderBy }
					onOrderByChange={ vi.fn() }
					onOrderChange={ vi.fn() }
				/>
			);

			expect(
				screen.getByRole( 'combobox', { name: 'Order by' } )
			).toHaveTextContent( /^Select$/ );
		}
	);

	it( 'hides the field when there are no options', async () => {
		await render(
			<QueryControls
				orderByOptions={ [] }
				onOrderByChange={ vi.fn() }
				onOrderChange={ vi.fn() }
			/>
		);

		expect(
			screen.queryByRole( 'combobox', { name: 'Order by' } )
		).not.toBeInTheDocument();
	} );

	it( 'calls only the callbacks for changed sort values when selecting custom options', async () => {
		const onOrderByChange = vi.fn();
		const onOrderChange = vi.fn();
		await render(
			<QueryControls
				order="desc"
				orderBy="menu_order"
				orderByOptions={ [
					{ label: 'Reverse menu order', value: 'menu_order/desc' },
					{ label: 'Menu order', value: 'menu_order/asc' },
					{ label: 'Newest first', value: 'date/desc' },
				] }
				onOrderByChange={ onOrderByChange }
				onOrderChange={ onOrderChange }
			/>
		);
		const trigger = screen.getByRole( 'combobox', { name: 'Order by' } );

		expect( trigger ).toHaveTextContent( 'Reverse menu order' );
		await userEvent.click( trigger );
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Reverse menu order' } )
		);
		expect( onOrderByChange ).not.toHaveBeenCalled();
		expect( onOrderChange ).not.toHaveBeenCalled();

		await expect.element( trigger ).toHaveFocus();
		await userEvent.click( trigger );
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Menu order' } )
		);
		expect( onOrderByChange ).not.toHaveBeenCalled();
		expect( onOrderChange ).toHaveBeenCalledExactlyOnceWith( 'asc' );

		await expect.element( trigger ).toHaveFocus();
		await userEvent.click( trigger );
		await userEvent.click(
			screen.getByRole( 'option', { name: 'Newest first' } )
		);
		expect( onOrderByChange ).toHaveBeenCalledExactlyOnceWith( 'date' );
		expect( onOrderChange ).toHaveBeenCalledTimes( 1 );
	} );
} );
