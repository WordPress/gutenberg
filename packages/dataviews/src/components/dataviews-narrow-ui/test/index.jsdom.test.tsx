import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DataViews from '../../../dataviews';
import DataViewsPicker from '../../../dataviews-picker';
import type { Field, NarrowOptions, View } from '../../../types';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockPointerEvent();
globalThis.wpVitest.mockCSSSupports();
// `Tabs.List` watches its size to know when the tabs overflow.
globalThis.wpVitest.mockResizeObserver();

type Item = {
	id: number;
	title: string;
	type: string;
	status: string;
};

const data: Item[] = [
	{ id: 1, title: 'Earth', type: 'planet', status: 'visited' },
	{ id: 2, title: 'Moon', type: 'satellite', status: 'visited' },
];

const fields: Field< Item >[] = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		filterBy: false,
		enableSorting: false,
	},
	{
		id: 'type',
		label: 'Type',
		type: 'text',
		elements: [
			{ value: 'planet', label: 'Planet' },
			{ value: 'satellite', label: 'Satellite' },
		],
		filterBy: { operators: [ 'is', 'isNot' ] },
		enableSorting: false,
	},
	{
		id: 'status',
		label: 'Status',
		type: 'text',
		elements: [
			{ value: 'visited', label: 'Visited' },
			{ value: 'unvisited', label: 'Unvisited' },
		],
		filterBy: { operators: [ 'is', 'isNot' ] },
		enableSorting: false,
	},
];

const getView = (
	type: 'grid' | 'pickerGrid',
	narrow?: boolean | NarrowOptions
): View => ( {
	type,
	page: 1,
	perPage: 10,
	titleField: 'title',
	filters: [],
	layout: { narrow },
} );

function renderDataViews( narrow?: boolean | NarrowOptions ) {
	render(
		<DataViews
			data={ data }
			fields={ fields }
			view={ getView( 'grid', narrow ) }
			onChangeView={ vi.fn() }
			paginationInfo={ { totalItems: data.length, totalPages: 1 } }
			defaultLayouts={ { grid: {} } }
			getItemId={ ( item ) => item.id.toString() }
		/>
	);
}

describe( 'The `narrow` option of the grid layout', () => {
	it( 'keeps the default UI when it is off', async () => {
		renderDataViews();

		expect(
			await screen.findByRole( 'button', { name: 'Add filter' } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
	} );

	it( 'replaces the filters and view options buttons with a single settings menu', async () => {
		const user = userEvent.setup();
		renderDataViews( true );

		expect( screen.getByRole( 'searchbox' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Add filter' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'button', { name: 'View options' } )
		);

		expect(
			await screen.findByRole( 'group', { name: 'Type' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'group', { name: 'Status' } )
		).toBeInTheDocument();
	} );

	it( 'shows one field as tabs and leaves it out of the settings menu', async () => {
		const user = userEvent.setup();
		renderDataViews( { tabsField: 'type' } );

		expect(
			( await screen.findAllByRole( 'tab' ) ).map(
				( tab ) => tab.textContent
			)
		).toEqual( [ 'All', 'Planet', 'Satellite' ] );

		await user.click(
			screen.getByRole( 'button', { name: 'View options' } )
		);

		expect(
			await screen.findByRole( 'group', { name: 'Status' } )
		).toBeInTheDocument();
		// The field shown as tabs isn't repeated in the menu.
		expect(
			screen.queryByRole( 'group', { name: 'Type' } )
		).not.toBeInTheDocument();
	} );

	it( 'applies to the grid of the picker, which keeps its own footer', async () => {
		render(
			<DataViewsPicker
				data={ data }
				fields={ fields }
				view={ getView( 'pickerGrid', true ) }
				onChangeView={ vi.fn() }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				defaultLayouts={ { pickerGrid: {} } }
				getItemId={ ( item ) => item.id.toString() }
				selection={ [] }
				onChangeSelection={ vi.fn() }
				actions={ [
					{
						id: 'confirm',
						label: 'Confirm',
						isPrimary: true,
						supportsBulk: false,
						callback: vi.fn(),
					},
				] }
				itemListLabel="Space objects"
			/>
		);

		expect(
			await screen.findByRole( 'button', { name: 'View options' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Add filter' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Confirm' } )
		).toBeInTheDocument();
	} );
} );
