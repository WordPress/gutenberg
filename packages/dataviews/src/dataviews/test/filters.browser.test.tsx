import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { useState } from '@wordpress/element';
import DataViews from '../index';
import type { Field, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';

type Post = {
	id: number;
	title: string;
	author: string;
};

const posts: Post[] = [
	{ id: 1, title: 'Hello World', author: 'jane' },
	{ id: 2, title: 'Homepage', author: 'john' },
	{ id: 3, title: 'News', author: 'john' },
];

// More than ten options enables the searchable filter widget.
const authors = [
	'Jane',
	'John',
	'Alex',
	'Chris',
	'Drew',
	'Francis',
	'Jamie',
	'Lee',
	'Morgan',
	'Robin',
	'Sam',
];

const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text', filterBy: false },
	{
		id: 'author',
		label: 'Author',
		type: 'text',
		elements: authors.map( ( author ) => ( {
			value: author.toLowerCase(),
			label: author,
		} ) ),
		filterBy: { isPrimary: true, operators: [ 'is' ] },
	},
];

function FilterableDataViews() {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		fields: [ 'title' ],
		page: 1,
		perPage: 10,
		filters: [],
	} );
	const { data, paginationInfo } = filterSortAndPaginate(
		posts,
		view,
		fields
	);

	return (
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: {} } }
		/>
	);
}

describe( 'DataViews filters', () => {
	it( 'filters the displayed items after searching for and selecting a filter option', async () => {
		const user = userEvent.setup();
		await render( <FilterableDataViews /> );

		const table = page.getByRole( 'table' );
		await expect
			.element( table.getByRole( 'cell', { name: 'Hello World' } ) )
			.toBeVisible();
		await expect
			.element( table.getByRole( 'cell', { name: 'Homepage' } ) )
			.toBeVisible();
		await expect
			.element( table.getByRole( 'cell', { name: 'News' } ) )
			.toBeVisible();

		await user.click(
			page.getByRole( 'button', { name: 'Author', exact: true } )
		);
		await user.type(
			page.getByRole( 'combobox', { name: 'Search items' } ),
			'joh'
		);
		await expect
			.element( page.getByRole( 'option', { name: 'John' } ) )
			.toBeVisible();
		await expect
			.element( page.getByRole( 'option', { name: 'Jane' } ) )
			.not.toBeInTheDocument();
		await expect
			.element( table.getByRole( 'cell', { name: 'Hello World' } ) )
			.toBeVisible();
		await user.keyboard( '{Enter}{Escape}' );

		await expect
			.element( table.getByRole( 'cell', { name: 'Hello World' } ) )
			.not.toBeInTheDocument();
		await expect
			.element( table.getByRole( 'cell', { name: 'Homepage' } ) )
			.toBeVisible();
		await expect
			.element( table.getByRole( 'cell', { name: 'News' } ) )
			.toBeVisible();
	} );
} );
