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
		// Options loaded on demand, which a menu can't list.
		id: 'author',
		label: 'Author',
		type: 'text',
		getElements: async () => [ { value: 'author-1', label: 'Author 1' } ],
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
}: {
	menuProps?: React.ComponentProps< typeof DataViews.ViewMenu >;
	view?: View;
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

	it( 'keeps a long list of options, in a submenu', async () => {
		const user = userEvent.setup();
		// As many options as plugins care to register.
		const sources = Array.from( { length: 14 }, ( _source, index ) => ( {
			value: `source-${ index }`,
			label: `Source ${ index }`,
		} ) );
		render(
			<DataViews
				data={ data }
				fields={ [
					...fields,
					{
						id: 'source',
						label: 'Source',
						type: 'text',
						getValue: () => 'source-0',
						elements: sources,
						filterBy: { operators: [ 'is' ] },
						enableSorting: false,
					},
				] }
				view={ {
					...DEFAULT_VIEW,
					filters: [
						{ field: 'source', operator: 'is', value: 'source-0' },
					],
				} }
				onChangeView={ vi.fn() }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				defaultLayouts={ { list: {} } }
				getItemId={ ( item ) => item.id.toString() }
			>
				<DataViews.ViewMenu requiredFields={ [ 'source' ] } />
			</DataViews>
		);

		await openMenu( user );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Source' } )
		);

		const options = await screen.findAllByRole( 'menuitemradio', {
			name: /^Source/,
		} );
		expect( options ).toHaveLength( 14 );
		expect( options[ 0 ] ).toBeChecked();
	} );

	it( 'keeps a long list in the menu when it is the only group', async () => {
		const user = userEvent.setup();
		const sources = Array.from( { length: 14 }, ( _source, index ) => ( {
			value: `source-${ index }`,
			label: `Source ${ index }`,
		} ) );
		const onChangeView = vi.fn();
		render(
			<DataViews
				data={ data }
				fields={ [
					{
						id: 'source',
						label: 'Source',
						type: 'text',
						getValue: () => 'source-0',
						elements: sources,
						filterBy: { operators: [ 'is' ] },
						enableSorting: false,
					},
				] }
				view={ {
					...DEFAULT_VIEW,
					titleField: undefined,
					filters: [
						{ field: 'source', operator: 'is', value: 'source-0' },
					],
				} }
				onChangeView={ onChangeView }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				defaultLayouts={ { list: {} } }
				getItemId={ ( item ) => item.id.toString() }
			>
				<DataViews.ViewMenu requiredFields={ [ 'source' ] } />
			</DataViews>
		);

		await openMenu( user );

		expect(
			await screen.findAllByRole( 'menuitemradio', { name: /^Source/ } )
		).toHaveLength( 14 );
		expect(
			screen.queryByRole( 'menuitem', { name: 'Source' } )
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole( 'menuitemradio', { name: 'Source 13' } )
		);

		expect( onChangeView ).toHaveBeenCalledWith(
			expect.objectContaining( {
				page: 1,
				filters: [
					{ field: 'source', operator: 'is', value: 'source-13' },
				],
			} )
		);
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
