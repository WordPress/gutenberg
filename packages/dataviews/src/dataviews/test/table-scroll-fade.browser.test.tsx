import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import '@wordpress/theme/design-tokens.css';
import DataViews from '../index';
import type { Action, Field, View } from '../../types';
import '../../style.scss';

type Post = {
	id: string;
	title: string;
	author: string;
	status: string;
	categories: string;
	tags: string;
};

const posts: Post[] = [
	{
		id: '1',
		title: 'How we rebuilt the newsletter from scratch',
		author: 'Ana Ruiz',
		status: 'Published',
		categories: 'Announcements, Product',
		tags: 'newsletter, email, design',
	},
	{
		id: '2',
		title: 'A field guide to sourdough starters',
		author: 'Emma Aoki',
		status: 'Draft',
		categories: 'Food',
		tags: 'baking, bread',
	},
];

const fields: Field< Post >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
	{ id: 'author', label: 'Author', type: 'text' },
	{ id: 'status', label: 'Status', type: 'text' },
	{ id: 'categories', label: 'Categories', type: 'text' },
	{ id: 'tags', label: 'Tags', type: 'text' },
];

const actions: Action< Post >[] = [
	{ id: 'edit', label: 'Edit', isPrimary: true, callback: () => {} },
	{ id: 'trash', label: 'Trash', callback: () => {} },
];

const allColumns = [ 'author', 'status', 'categories', 'tags' ];

function PostsTable( {
	columns = allColumns,
	withActions = false,
	width = 400,
	dir = 'ltr',
}: {
	columns?: string[];
	withActions?: boolean;
	width?: number;
	dir?: 'ltr' | 'rtl';
} ) {
	const view: View = {
		type: 'table',
		titleField: 'title',
		fields: columns,
		page: 1,
		perPage: 10,
	};
	return (
		<div dir={ dir } style={ { width, height: 400 } }>
			<DataViews
				data={ posts }
				fields={ fields }
				view={ view }
				onChangeView={ () => {} }
				actions={ withActions ? actions : undefined }
				paginationInfo={ { totalItems: 2, totalPages: 1 } }
				defaultLayouts={ { table: true } }
			/>
		</div>
	);
}

const getScrollContainer = () =>
	document.querySelector< HTMLElement >( '.dataviews-layout__container' )!;
const getFade = () =>
	document.querySelector< HTMLElement >(
		'.dataviews-view-table__scroll-fade'
	)!;

async function scrollToEnd( container: HTMLElement ) {
	const distance = container.scrollWidth - container.clientWidth;
	container.scrollLeft =
		getComputedStyle( container ).direction === 'rtl'
			? -distance
			: distance;
	container.dispatchEvent( new Event( 'scroll' ) );
}

describe( 'DataViews table scroll fade', () => {
	it( 'shows the fade while there are more columns to scroll to', async () => {
		await render( <PostsTable /> );

		await expect.element( getFade() ).not.toHaveAttribute( 'hidden' );
		expect(
			getFade().style.getPropertyValue(
				'--wp-dataviews-table-scroll-fade-height'
			)
		).toBe( `${ getScrollContainer().clientHeight }px` );

		await scrollToEnd( getScrollContainer() );
		await expect.element( getFade() ).toHaveAttribute( 'hidden' );
	} );

	it( 'does not show the fade when every column fits', async () => {
		await render( <PostsTable width={ 1600 } /> );

		await expect.element( getFade() ).toHaveAttribute( 'hidden' );
	} );

	it( 'shows the fade when columns are added without scrolling', async () => {
		const { rerender } = await render(
			<PostsTable columns={ [ 'author' ] } width={ 800 } />
		);
		await expect.element( getFade() ).toHaveAttribute( 'hidden' );

		await rerender( <PostsTable width={ 800 } /> );
		await expect.element( getFade() ).not.toHaveAttribute( 'hidden' );
	} );

	it( 'shows the fade at the start of the scroll range in RTL', async () => {
		await render( <PostsTable dir="rtl" /> );

		await expect.element( getFade() ).not.toHaveAttribute( 'hidden' );

		await scrollToEnd( getScrollContainer() );
		await expect.element( getFade() ).toHaveAttribute( 'hidden' );
	} );

	it( 'fades under the sticky actions column when there are actions', async () => {
		await render( <PostsTable withActions /> );
		const actionsHeader = document.querySelector< HTMLElement >(
			'th.dataviews-view-table__actions-column'
		)!;

		expect( getFade() ).toBeNull();
		await expect
			.element( actionsHeader )
			.toHaveClass( 'dataviews-view-table__actions-column--stuck' );
		expect(
			getComputedStyle( actionsHeader, '::before' ).maskImage
		).toContain( 'linear-gradient' );

		await scrollToEnd( getScrollContainer() );
		await expect
			.element( actionsHeader )
			.not.toHaveClass( 'dataviews-view-table__actions-column--stuck' );
	} );
} );
