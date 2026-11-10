import { expect, test, vi } from 'vitest';
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

test( 'only reports a taxonomy change when a different taxonomy is selected', async () => {
	const user = userEvent.setup();
	const onChange = vi.fn();
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
	render(
		<RegistryProvider value={ registry }>
			<TaxonomyControl
				label="Taxonomy"
				value="category"
				onChange={ onChange }
			/>
		</RegistryProvider>
	);

	await user.tab();
	await user.keyboard( '{Enter}' );
	await user.click( screen.getByRole( 'option', { name: 'Categories' } ) );
	expect( onChange ).not.toHaveBeenCalled();

	await user.keyboard( '{Enter}' );
	await user.click( screen.getByRole( 'option', { name: 'Tags' } ) );
	expect( onChange ).toHaveBeenCalledExactlyOnceWith( 'post_tag' );
} );
