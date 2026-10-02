import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useState } from '@wordpress/element';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports -- This browser regression needs the real design tokens to render checkbox targets.
import '@wordpress/theme/design-tokens.css';
import DataViews from '../index';
import type { Action, Field, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports -- Load the table overlay stylesheet to catch hidden column headers and obscured focus.
import '../../style.scss';

const initialViewport = {
	width: window.innerWidth,
	height: window.innerHeight,
};
beforeEach( async () => {
	await page.viewport( 1280, 900 );
} );
afterEach( async () => {
	await page.viewport( initialViewport.width, initialViewport.height );
} );

type Post = { id: string; title: string; author: string };
const posts: Post[] = [
	{ id: '1', title: 'First post', author: 'Alice' },
	{ id: '2', title: 'Second post', author: 'Bob' },
];
const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
	{ id: 'author', label: 'Author', type: 'text' },
];
const actions: Action< Post >[] = [
	{ id: 'edit', label: 'Edit', supportsBulk: true, callback: () => {} },
];

function SelectableTable() {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		titleField: 'title',
		fields: [ 'author' ],
		sort: { field: 'author', direction: 'desc' },
		page: 1,
		perPage: 10,
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
			actions={ actions }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: true } }
		/>
	);
}

it( 'keeps column names and sorting accessible during selection, skips covered controls, and restores sorting after deselection', async () => {
	const user = userEvent.setup();
	await render( <SelectableTable /> );
	await user.click(
		page.getByRole( 'checkbox', { name: 'Select all', exact: true } )
	);

	await expect
		.element(
			page.getByRole( 'columnheader', { name: 'Title', exact: true } )
		)
		.toBeVisible();
	await expect
		.element(
			page.getByRole( 'columnheader', { name: 'Author', exact: true } )
		)
		.toHaveAttribute( 'aria-sort', 'descending' );
	await expect
		.element( page.getByRole( 'button', { name: /^Title/ } ) )
		.not.toBeInTheDocument();
	await expect
		.element( page.getByRole( 'button', { name: /^Author/ } ) )
		.not.toBeInTheDocument();

	await expect
		.element(
			page.getByRole( 'checkbox', { name: 'Deselect all', exact: true } )
		)
		.toHaveFocus();
	await user.keyboard( '{Tab}' );
	await expect
		.element( page.getByRole( 'button', { name: 'Edit', exact: true } ) )
		.toHaveFocus();
	await user.keyboard( '{Tab}' );
	await expect
		.element( page.getByRole( 'button', { name: 'Cancel', exact: true } ) )
		.toHaveFocus();
	await user.click(
		page.getByRole( 'button', { name: 'Cancel', exact: true } )
	);

	await expect
		.element(
			page.getByRole( 'checkbox', { name: 'Select all', exact: true } )
		)
		.toHaveFocus();
	await user.keyboard( '{Tab}' );
	await expect
		.element( page.getByRole( 'button', { name: /^Title/ } ) )
		.toHaveFocus();
	await user.keyboard( '{Enter}' );
	await user.click(
		page.getByRole( 'menuitemradio', {
			name: 'Sort descending',
			exact: true,
		} )
	);
	await user.keyboard( '{Escape}' );
	await expect
		.element( page.getByRole( 'columnheader', { name: /Title/ } ) )
		.toHaveAttribute( 'aria-sort', 'descending' );
	await expect
		.element( page.getByRole( 'columnheader', { name: /Author/ } ) )
		.not.toHaveAttribute( 'aria-sort' );
} );
