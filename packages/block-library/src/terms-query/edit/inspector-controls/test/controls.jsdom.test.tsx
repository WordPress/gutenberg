import { describe, expect, test, vi } from 'vitest';
import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

const { default: TaxonomyControl } = await vi.importActual< {
	default: ComponentType< {
		label: string;
		value: string;
		onChange: ( value: string ) => void;
	} >;
} >( '../taxonomy-control' );
const { default: OrderControl } = await vi.importActual< {
	default: ComponentType< {
		label: string;
		orderBy: string;
		order: string;
		onChange: ( orderBy: string, order: string ) => void;
		disabled?: boolean;
		help?: string;
	} >;
} >( '../order-control' );

function renderTaxonomyControl( onChange: ( value: string ) => void ) {
	const registry = createRegistry();
	registry.register( coreDataStore );
	registry.dispatch( coreDataStore ).receiveEntityRecords(
		'root',
		'taxonomy',
		[
			{
				name: 'Categories',
				slug: 'category',
				visibility: { publicly_queryable: true },
			},
			{
				name: 'Tags',
				slug: 'post_tag',
				visibility: { publicly_queryable: true },
			},
		],
		{ per_page: -1 }
	);
	registry
		.dispatch( coreDataStore )
		.finishResolution( 'getTaxonomies', [ { per_page: -1 } ] );
	return render(
		<RegistryProvider value={ registry }>
			<TaxonomyControl
				label="Taxonomy"
				value="category"
				onChange={ onChange }
			/>
		</RegistryProvider>
	);
}

describe( 'Terms Query selectors', () => {
	test( 'changes the taxonomy so its selected terms can be cleared', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderTaxonomyControl( onChange );

		await user.tab();
		await user.keyboard( '{Enter}' );
		expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
		await user.click( screen.getByRole( 'option', { name: 'Tags' } ) );
		expect( onChange ).toHaveBeenCalledExactlyOnceWith( 'post_tag' );
	} );

	test( 'does not reset selected terms when reselecting the current taxonomy', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		renderTaxonomyControl( onChange );

		await user.tab();
		await user.keyboard( '{Enter}' );
		await user.click(
			screen.getByRole( 'option', { name: 'Categories' } )
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );

	test.each( [
		[ 'Name: A → Z', 'name', 'asc' ],
		[ 'Name: Z → A', 'name', 'desc' ],
		[ 'Count, high to low', 'count', 'desc' ],
		[ 'Count, low to high', 'count', 'asc' ],
	] )(
		'preserves the ordering choice %s',
		async ( label, orderBy, order ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<OrderControl
					label="Order by"
					orderBy="name"
					order="asc"
					onChange={ onChange }
				/>
			);

			await user.tab();
			await user.keyboard( '{Enter}' );
			expect(
				screen
					.getAllByRole( 'option' )
					.map( ( item ) => item.textContent )
			).toEqual( [
				'Name: A → Z',
				'Name: Z → A',
				'Count, high to low',
				'Count, low to high',
			] );
			await user.click( screen.getByRole( 'option', { name: label } ) );
			expect( onChange ).toHaveBeenCalledExactlyOnceWith(
				orderBy,
				order
			);
		}
	);

	test( 'disables ordering and describes selection order when terms are selected', () => {
		const help =
			'When specific terms are selected, the order is based on their selection order.';
		render(
			<OrderControl
				label="Order by"
				orderBy="name"
				order="asc"
				onChange={ vi.fn() }
				disabled
				help={ help }
			/>
		);

		const control = screen.getByRole( 'combobox', { name: 'Order by' } );
		expect( control ).toBeDisabled();
		expect( control ).toHaveAccessibleDescription( help );
	} );
} );
