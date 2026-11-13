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

function PostsTable( {
	withActions = false,
	width = 400,
	dir = 'ltr',
	selection,
}: {
	withActions?: boolean;
	width?: number;
	dir?: 'ltr' | 'rtl';
	selection?: string[];
} ) {
	const view: View = {
		type: 'table',
		titleField: 'title',
		fields: [ 'author', 'status', 'categories', 'tags' ],
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
				selection={ selection }
				onChangeSelection={ () => {} }
			/>
		</div>
	);
}

// `--wpds-dimension-size-lg`.
const FADE_SIZE = 40;

const getScrollContainer = () =>
	document.querySelector< HTMLElement >( '.dataviews-layout__container' )!;
const getActionsHeader = () =>
	document.querySelector< HTMLElement >(
		'th.dataviews-view-table__actions-column'
	)!;
const getDividerOpacity = () =>
	getComputedStyle( getActionsHeader(), '::after' ).opacity;

function scrollToEnd() {
	const container = getScrollContainer();
	const distance = container.scrollWidth - container.clientWidth;
	container.scrollLeft =
		getComputedStyle( container ).direction === 'rtl'
			? -distance
			: distance;
}

describe( 'DataViews table scroll fade', () => {
	describe( 'with actions', () => {
		it( 'fades the columns scrolling under the actions column', async () => {
			await render( <PostsTable withActions /> );

			const style = getComputedStyle( getActionsHeader() );
			expect( style.maskImage ).toBe(
				`linear-gradient(to right, rgba(0, 0, 0, 0), rgb(0, 0, 0) ${ FADE_SIZE }px)`
			);
			expect( style.paddingInlineStart ).toBe( `${ FADE_SIZE }px` );
		} );

		it( 'flips the fade in RTL', async () => {
			await render( <PostsTable withActions dir="rtl" /> );

			expect( getComputedStyle( getActionsHeader() ).maskImage ).toBe(
				`linear-gradient(to left, rgba(0, 0, 0, 0), rgb(0, 0, 0) ${ FADE_SIZE }px)`
			);
		} );

		it( 'shows the divider until the end of the scroll range', async () => {
			await render( <PostsTable withActions /> );

			await expect.poll( getDividerOpacity ).toBe( '1' );

			scrollToEnd();
			await expect.poll( getDividerOpacity ).toBe( '0' );
		} );

		it( 'shows the divider until the end of the scroll range in RTL', async () => {
			await render( <PostsTable withActions dir="rtl" /> );

			await expect.poll( getDividerOpacity ).toBe( '1' );

			scrollToEnd();
			await expect.poll( getDividerOpacity ).toBe( '0' );
		} );

		it( 'hides the divider when every column fits', async () => {
			await render( <PostsTable withActions width={ 1600 } /> );

			// Wait for a frame, so a scroll timeline would have been resolved.
			await new Promise( requestAnimationFrame );
			expect( getDividerOpacity() ).toBe( '0' );
		} );
	} );
} );
