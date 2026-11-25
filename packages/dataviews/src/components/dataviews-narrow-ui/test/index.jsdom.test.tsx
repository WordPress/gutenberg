import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DataViews from '../../../dataviews';
import type { Field, View } from '../../../types';

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

const view: View = {
	type: 'list',
	page: 1,
	perPage: 10,
	titleField: 'title',
	filters: [],
};

describe( 'DataViews.NarrowUI', () => {
	it( 'shows one field as tabs and the other filters in a single settings menu', async () => {
		const user = userEvent.setup();
		render(
			<DataViews
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ vi.fn() }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				defaultLayouts={ { list: {} } }
				getItemId={ ( item ) => item.id.toString() }
			>
				<DataViews.NarrowUI tabsField="type" />
			</DataViews>
		);

		expect( screen.getByRole( 'searchbox' ) ).toBeInTheDocument();
		expect(
			( await screen.findAllByRole( 'tab' ) ).map(
				( tab ) => tab.textContent
			)
		).toEqual( [ 'All', 'Planet', 'Satellite' ] );
		// The default UI's two buttons are replaced by one.
		expect(
			screen.queryByRole( 'button', { name: 'Add filter' } )
		).not.toBeInTheDocument();

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
} );
