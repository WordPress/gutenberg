import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { useState } from '@wordpress/element';
import DataViews from '../../../dataviews';
import { OPERATOR_IS_ANY } from '../../../constants';
import type { Field, View } from '../../../types';
import filterSortAndPaginate from '../../../utils/filter-sort-and-paginate';
// The truncation under test is defined in the filters stylesheet, so the chip
// has to be rendered with it.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../style.scss';

type Post = {
	id: number;
	title: string;
	status: string;
	author: string;
};

const posts: Post[] = [
	{ id: 1, title: 'Hello World', status: 'publish', author: 'jane' },
];

const statuses = [
	'Draft',
	'Scheduled',
	'Pending Review',
	'Private',
	'Published',
	'Trash',
];

const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text', filterBy: false },
	{
		id: 'status',
		label: 'Status',
		type: 'text',
		elements: statuses.map( ( status ) => ( {
			value: status.toLowerCase(),
			label: status,
		} ) ),
		filterBy: { isPrimary: true, operators: [ OPERATOR_IS_ANY ] },
	},
	{
		id: 'author',
		label: 'Author',
		type: 'text',
		elements: [ { value: 'jane', label: 'Jane' } ],
		filterBy: { isPrimary: true, operators: [ OPERATOR_IS_ANY ] },
	},
];

// Narrow enough that the status chip cannot fit all six values.
const CONTAINER_WIDTH = 360;

function FilteredDataViews() {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		fields: [ 'title' ],
		page: 1,
		perPage: 10,
		filters: [
			{
				field: 'status',
				operator: OPERATOR_IS_ANY,
				value: statuses.map( ( status ) => status.toLowerCase() ),
			},
			{ field: 'author', operator: OPERATOR_IS_ANY, value: [ 'jane' ] },
		],
	} );
	const { data, paginationInfo } = filterSortAndPaginate(
		posts,
		view,
		fields
	);

	return (
		<div style={ { width: CONTAINER_WIDTH } }>
			<DataViews
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
			/>
		</div>
	);
}

describe( 'Filter chip', () => {
	it( 'truncates values too long for the container instead of wrapping', async () => {
		const screen = await render( <FilteredDataViews /> );

		const longChip = screen.getByRole( 'button', {
			name: /^Status includes:/,
		} );
		const shortChip = screen.getByRole( 'button', {
			name: /^Author includes:/,
		} );
		await expect.element( longChip ).toBeVisible();

		const longChipElement = longChip.element();
		const value = longChipElement.querySelector(
			'.dataviews-filters__summary-filter-text-value'
		) as HTMLElement;

		expect( value.scrollWidth ).toBeGreaterThan( value.clientWidth );
		expect( longChipElement.getBoundingClientRect().height ).toBe(
			shortChip.element().getBoundingClientRect().height
		);
		expect(
			longChipElement.getBoundingClientRect().right
		).toBeLessThanOrEqual( CONTAINER_WIDTH );
	} );

	it( 'keeps every truncated value in the accessible name', async () => {
		const screen = await render( <FilteredDataViews /> );

		await expect
			.element(
				screen.getByRole( 'button', {
					name: `Status includes: ${ statuses.join( ', ' ) }`,
				} )
			)
			.toBeVisible();
	} );
} );
