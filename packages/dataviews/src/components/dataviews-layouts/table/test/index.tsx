/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ViewTable from '../index';
import type {
	ViewTable as ViewTableType,
	NormalizedField,
} from '../../../../types';

type Item = { id: string; title: string };

const fields = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		render: ( { item }: { item: Item } ) => <span>{ item.title }</span>,
		getValue: ( { item }: { item: Item } ) => item.title,
	},
] as unknown as NormalizedField< Item >[];

const view: ViewTableType = {
	type: 'table',
	fields: [],
	titleField: 'title',
};

const defaultProps = {
	actions: [],
	fields,
	getItemId: ( item: Item ) => item.id,
	isItemClickable: () => false,
	onChangeView: jest.fn(),
	onChangeSelection: jest.fn(),
	selection: [] as string[],
	setOpenedFilter: jest.fn(),
	view,
	empty: <p>No results</p>,
};

describe( 'ViewTable', () => {
	it( 'should not render table headers when data is empty', () => {
		render( <ViewTable { ...defaultProps } data={ [] } /> );

		expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'columnheader' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'No results' ) ).toBeInTheDocument();
	} );

	it( 'should render a loading spinner without table headers when loading with no data', () => {
		render( <ViewTable { ...defaultProps } data={ [] } isLoading /> );

		expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'columnheader' ) ).not.toBeInTheDocument();
	} );

	it( 'should render table headers when data is present', () => {
		const data = [
			{ id: '1', title: 'Item 1' },
			{ id: '2', title: 'Item 2' },
		];
		render( <ViewTable { ...defaultProps } data={ data } /> );

		expect( screen.getByRole( 'table' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Item 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Item 2' ) ).toBeInTheDocument();
	} );
} );
