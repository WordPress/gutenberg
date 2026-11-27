import { render } from 'vitest-browser-react';
import { expect, it } from 'vitest';
import '@wordpress/theme/design-tokens.css';
import '@wordpress/components/src/button/style.scss';
import DataViews from '../index';
import type { Action, Field, View } from '../../types';
import '../../style.scss';

type Post = {
	id: string;
	title: string;
	views: number;
	likes: number;
	author: string;
};

const posts: Post[] = [
	{ id: '1', title: 'Hello world', views: 45, likes: 3, author: 'Ana' },
	{ id: '2', title: 'Sample page', views: 7, likes: 0, author: 'Emma' },
];

const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
	{ id: 'views', label: 'Views', type: 'integer' },
	{ id: 'likes', label: 'Likes', type: 'number' },
	{ id: 'author', label: 'Author', type: 'text' },
];

const actions: Action< Post >[] = [
	{ id: 'edit', label: 'Edit', isPrimary: true, callback: () => {} },
	{ id: 'trash', label: 'Trash', callback: () => {} },
];

function PostsTable( { columns }: { columns: string[] } ) {
	const view: View = {
		type: 'table',
		titleField: 'title',
		fields: columns,
		page: 1,
		perPage: 10,
	};
	return (
		<div style={ { width: 480, height: 400 } }>
			<DataViews
				data={ posts }
				fields={ fields }
				view={ view }
				onChangeView={ () => {} }
				actions={ actions }
				paginationInfo={ { totalItems: 2, totalPages: 1 } }
				defaultLayouts={ { table: true } }
			/>
		</div>
	);
}

const getScrollContainer = () =>
	document.querySelector< HTMLElement >( '.dataviews-layout__container' )!;
const getCellWidth = ( column: number ) =>
	document
		.querySelector< HTMLElement >(
			`.dataviews-view-table tbody tr td:nth-child(${ column })`
		)!
		.getBoundingClientRect().width;

it( 'fits two numeric columns in a container that their 15ch floors would overflow', async () => {
	const screen = await render(
		<PostsTable columns={ [ 'views', 'likes' ] } />
	);
	await expect.element( screen.getByText( 'Hello world' ) ).toBeVisible();

	const container = getScrollContainer();
	expect( container.scrollWidth ).toBe( container.clientWidth );
} );

it( 'keeps the floor on a text column', async () => {
	const screen = await render(
		<PostsTable columns={ [ 'views', 'author' ] } />
	);
	await expect.element( screen.getByText( 'Hello world' ) ).toBeVisible();

	// Title, Views, Author: the short author names still get the wider column.
	expect( getCellWidth( 3 ) ).toBeGreaterThan( getCellWidth( 2 ) + 30 );
} );
