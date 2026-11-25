import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DataViews from '../../../dataviews';
import type { Field, View } from '../../../types';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockPointerEvent();
globalThis.wpVitest.mockCSSSupports();

type Item = {
	id: number;
	title: string;
	status: string;
	author: string;
	date: string;
	tags: string[];
};

const data: Item[] = [
	{
		id: 1,
		title: 'Hello',
		status: 'draft',
		author: 'author-1',
		date: '2025-01-15T09:00:00',
		tags: [ 'news' ],
	},
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
		id: 'status',
		label: 'Status',
		type: 'text',
		elements: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'published', label: 'Published' },
		],
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
	{
		// Too many options for a menu.
		id: 'author',
		label: 'Author',
		type: 'text',
		elements: Array.from( { length: 12 }, ( _author, index ) => ( {
			value: `author-${ index }`,
			label: `Author ${ index }`,
		} ) ),
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
	},
	{
		// Not a list of choices.
		id: 'date',
		label: 'Date',
		type: 'datetime',
		enableSorting: false,
	},
	{
		// Several values at once, as array fields are filtered by default.
		id: 'tags',
		label: 'Tags',
		type: 'array',
		elements: [
			{ value: 'news', label: 'News' },
			{ value: 'guides', label: 'Guides' },
		],
		enableSorting: false,
	},
];

const DEFAULT_VIEW: View = {
	type: 'list',
	page: 3,
	perPage: 10,
	titleField: 'title',
	filters: [],
};

function renderViewMenu( {
	menuProps,
	view = DEFAULT_VIEW,
	onReset,
}: {
	menuProps?: React.ComponentProps< typeof DataViews.ViewMenu >;
	view?: View;
	onReset?: ( () => void ) | false;
} = {} ) {
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
			onReset={ onReset }
		>
			<DataViews.ViewMenu { ...menuProps } />
		</DataViews>
	);
	return { onChangeView };
}

const openMenu = ( user: ReturnType< typeof userEvent.setup > ) =>
	user.click( screen.getByRole( 'button', { name: 'View options' } ) );

describe( 'DataViews.ViewMenu', () => {
	it( 'lists only the filters that work as menu items', async () => {
		const user = userEvent.setup();
		renderViewMenu();

		await openMenu( user );

		expect(
			( await screen.findAllByRole( 'menuitemradio' ) ).map(
				( item ) => item.textContent
			)
		).toEqual( [ 'All', 'Draft', 'Published' ] );
		expect(
			screen
				.getAllByRole( 'menuitemcheckbox' )
				.map( ( item ) => item.textContent )
		).toEqual( [ 'News', 'Guides' ] );
		expect(
			screen.getByRole( 'group', { name: 'Status' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'group', { name: 'Tags' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'group', { name: 'Author' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'group', { name: 'Date' } )
		).not.toBeInTheDocument();
	} );

	it( 'filters the view by the chosen option and goes back to the first page', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderViewMenu();

		await openMenu( user );
		await user.click(
			await screen.findByRole( 'menuitemradio', { name: 'Published' } )
		);

		expect( onChangeView ).toHaveBeenCalledWith(
			expect.objectContaining( {
				page: 1,
				filters: [
					{ field: 'status', operator: 'is', value: 'published' },
				],
			} )
		);
	} );

	it( 'checks the option of the active filter and removes it with "All"', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderViewMenu( {
			view: {
				...DEFAULT_VIEW,
				filters: [
					{ field: 'status', operator: 'is', value: 'draft' },
				],
			},
		} );

		await openMenu( user );

		expect(
			await screen.findByRole( 'menuitemradio', { name: 'Draft' } )
		).toBeChecked();

		await user.click(
			screen.getByRole( 'menuitemradio', { name: 'All' } )
		);

		expect( onChangeView ).toHaveBeenCalledWith(
			expect.objectContaining( { filters: [] } )
		);
	} );

	it( 'adds and removes values of a filter that takes several', async () => {
		const user = userEvent.setup();
		const { onChangeView } = renderViewMenu( {
			view: {
				...DEFAULT_VIEW,
				filters: [
					{ field: 'tags', operator: 'isAny', value: [ 'news' ] },
				],
			},
		} );

		await openMenu( user );

		expect(
			await screen.findByRole( 'menuitemcheckbox', { name: 'News' } )
		).toBeChecked();

		await user.click(
			screen.getByRole( 'menuitemcheckbox', { name: 'Guides' } )
		);

		expect( onChangeView ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				page: 1,
				filters: [
					{
						field: 'tags',
						operator: 'isAny',
						value: [ 'news', 'guides' ],
					},
				],
			} )
		);

		// With its last value unchecked, the filter goes away.
		await user.click(
			screen.getByRole( 'menuitemcheckbox', { name: 'News' } )
		);

		expect( onChangeView ).toHaveBeenLastCalledWith(
			expect.objectContaining( { filters: [] } )
		);
	} );

	it( 'has no "All" option for a field that always needs a value', async () => {
		const user = userEvent.setup();
		renderViewMenu( { menuProps: { requiredFields: [ 'status' ] } } );

		await openMenu( user );

		expect(
			( await screen.findAllByRole( 'menuitemradio' ) ).map(
				( item ) => item.textContent
			)
		).toEqual( [ 'Draft', 'Published' ] );
	} );

	it( 'resets the view from the menu', async () => {
		const user = userEvent.setup();
		const onReset = vi.fn();
		renderViewMenu( { onReset } );

		await openMenu( user );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Reset view' } )
		);

		expect( onReset ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders nothing when the menu would be empty', () => {
		renderViewMenu( {
			menuProps: { excludeFields: [ 'status', 'tags' ] },
		} );

		expect(
			screen.queryByRole( 'button', { name: 'View options' } )
		).not.toBeInTheDocument();
	} );
} );
