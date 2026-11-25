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
	mediaType: string;
	categories: string[];
};

const data: Item[] = [
	{ id: 1, title: 'Sunset', mediaType: 'image', categories: [ 'banners' ] },
	{
		id: 2,
		title: 'Interview',
		mediaType: 'video',
		categories: [ 'about', 'banners' ],
	},
];

const fields: Field< Item >[] = [
	{ id: 'title', label: 'Title', type: 'text', filterBy: false },
	{
		id: 'mediaType',
		label: 'Media type',
		type: 'text',
		elements: [
			{ value: 'image', label: 'Images' },
			{ value: 'video', label: 'Videos' },
		],
		filterBy: { operators: [ 'is' ] },
	},
	{
		id: 'category',
		label: 'Category',
		type: 'array',
		getValue: ( { item } ) => item.categories,
		elements: [
			{ value: 'about', label: 'About' },
			{ value: 'banners', label: 'Banners' },
		],
		filterBy: { operators: [ 'isAny' ] },
	},
];

const DEFAULT_VIEW: View = {
	type: 'list',
	page: 3,
	perPage: 10,
	titleField: 'title',
	filters: [],
};

function renderFilterTabs(
	props: { field: string; showAll?: boolean },
	view: View = DEFAULT_VIEW
) {
	const onChangeView = vi.fn();
	render(
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			paginationInfo={ { totalItems: data.length, totalPages: 1 } }
			defaultLayouts={ { list: {} } }
			getItemId={ ( item ) => item.id.toString() }
		>
			<DataViews.FilterTabs { ...props } />
		</DataViews>
	);
	return { onChangeView };
}

describe( 'DataViews.FilterTabs', () => {
	it( 'filters the view by the chosen tab and goes back to the first page', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderFilterTabs( { field: 'mediaType' } );

		await user.click( screen.getByRole( 'tab', { name: 'Videos' } ) );

		expect( onChangeView ).toHaveBeenCalledWith(
			expect.objectContaining( {
				page: 1,
				filters: [
					{ field: 'mediaType', operator: 'is', value: 'video' },
				],
			} )
		);
	} );

	it( 'matches a list of values when the field holds several', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderFilterTabs( { field: 'category' } );

		await user.click( screen.getByRole( 'tab', { name: 'Banners' } ) );

		expect( onChangeView ).toHaveBeenCalledWith(
			expect.objectContaining( {
				filters: [
					{
						field: 'category',
						operator: 'isAny',
						value: [ 'banners' ],
					},
				],
			} )
		);
	} );

	it( 'selects the tab of the active filter and removes it with the "All" tab', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderFilterTabs(
			{ field: 'mediaType' },
			{
				...DEFAULT_VIEW,
				search: 'sun',
				filters: [
					{ field: 'mediaType', operator: 'is', value: 'video' },
					{
						field: 'category',
						operator: 'isAny',
						value: [ 'about' ],
					},
				],
			}
		);

		expect( screen.getByRole( 'tab', { name: 'Videos' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		await user.click( screen.getByRole( 'tab', { name: 'All' } ) );

		// Only the tab's own filter goes: the rest of the view stays.
		expect( onChangeView ).toHaveBeenCalledWith(
			expect.objectContaining( {
				search: 'sun',
				filters: [
					{
						field: 'category',
						operator: 'isAny',
						value: [ 'about' ],
					},
				],
			} )
		);
	} );

	it( 'has no "All" tab when `showAll` is false', async () => {
		renderFilterTabs( { field: 'mediaType', showAll: false } );

		expect(
			( await screen.findAllByRole( 'tab' ) ).map(
				( tab ) => tab.textContent
			)
		).toEqual( [ 'Images', 'Videos' ] );
	} );
} );
