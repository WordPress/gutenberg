import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import '@wordpress/theme/design-tokens.css';
import '@wordpress/components/src/button/style.scss';
import DataViews from '../index';
import type { Action, ColumnStyle, Field, View } from '../../types';
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
	density,
	styles,
}: {
	withActions?: boolean;
	width?: number;
	dir?: 'ltr' | 'rtl';
	density?: 'compact' | 'comfortable';
	styles?: Record< string, ColumnStyle >;
} ) {
	const view: View = {
		type: 'table',
		titleField: 'title',
		fields: [ 'author', 'status', 'categories', 'tags' ],
		page: 1,
		perPage: 10,
		layout: { density, styles },
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

// `--wpds-dimension-padding-2xl`, the padding at the ends of the rows.
const FADE_SIZE = 24;
// `--wpds-dimension-padding-md` and `--wpds-dimension-padding-sm`.
const CELL_PADDING = 12;
const COMPACT_CELL_PADDING = 8;

const getScrollContainer = () =>
	document.querySelector< HTMLElement >( '.dataviews-layout__container' )!;
const getActionsHeader = () =>
	document.querySelector< HTMLElement >(
		'th.dataviews-view-table__actions-column'
	)!;
const getActionsCell = () =>
	document.querySelector< HTMLElement >(
		'td.dataviews-view-table__actions-column'
	)!;
const getDividerOpacity = () =>
	getComputedStyle( getActionsHeader(), '::after' ).opacity;
const getRows = () =>
	Array.from(
		document.querySelectorAll< HTMLTableRowElement >(
			'.dataviews-view-table tr'
		)
	);

const getTextBox = ( element: Element ) => {
	const range = document.createRange();
	range.selectNodeContents( element );
	return range.getBoundingClientRect();
};
const getTextRight = ( element: Element ) => getTextBox( element ).right;
const getTextLeft = ( element: Element ) => getTextBox( element ).left;

function scrollToMiddle() {
	const container = getScrollContainer();
	const distance = ( container.scrollWidth - container.clientWidth ) / 2;
	container.scrollLeft =
		getComputedStyle( container ).direction === 'rtl'
			? -distance
			: distance;
}

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
		it.each( [ 'ltr', 'rtl' ] as const )(
			'keeps room for the fade before the actions and the row padding after them (%s)',
			async ( dir ) => {
				await render( <PostsTable withActions dir={ dir } /> );

				const style = getComputedStyle( getActionsHeader() );
				expect( style.paddingInlineStart ).toBe(
					`${ FADE_SIZE + CELL_PADDING }px`
				);
				expect( style.paddingInlineEnd ).toBe( `${ FADE_SIZE }px` );
			}
		);

		it( 'keeps the start padding of the actions after the fade', async () => {
			await render( <PostsTable withActions density="compact" /> );

			expect(
				getComputedStyle( getActionsHeader() ).paddingInlineStart
			).toBe( `${ FADE_SIZE + COMPACT_CELL_PADDING }px` );
		} );

		it( 'shows the divider whenever the columns scroll', async () => {
			await render( <PostsTable withActions /> );

			await expect.poll( getDividerOpacity ).toBe( '1' );

			scrollToEnd();
			await expect.poll( getDividerOpacity ).toBe( '1' );
		} );

		it( 'shows the divider whenever the columns scroll in RTL', async () => {
			await render( <PostsTable withActions dir="rtl" /> );

			await expect.poll( getDividerOpacity ).toBe( '1' );

			scrollToEnd();
			await expect.poll( getDividerOpacity ).toBe( '1' );
		} );

		it( 'hides the divider when every column fits', async () => {
			await render( <PostsTable withActions width={ 1600 } /> );

			// Wait for a frame, so a scroll timeline would have been resolved.
			await new Promise( requestAnimationFrame );
			expect( getDividerOpacity() ).toBe( '0' );
		} );

		it( 'stops the row lines at the divider until the end of the scroll range', async () => {
			await render( <PostsTable withActions /> );
			const getLineSize = () =>
				getComputedStyle( getActionsCell() ).backgroundSize;

			await expect
				.poll( getLineSize )
				.toBe( `calc(100% - ${ FADE_SIZE }px) 1px` );

			scrollToEnd();
			await expect.poll( getLineSize ).toBe( '100% 1px' );
			expect( getComputedStyle( getActionsCell() ).maskImage ).toBe(
				'none'
			);
		} );
	} );

	// Every fade is opaque towards the edge of the row it sits at.
	it.each( [
		[ 'ltr', 'left', 'right' ],
		[ 'rtl', 'right', 'left' ],
	] as const )(
		'fades towards the edges of the rows (%s)',
		async ( dir, start, end ) => {
			await render( <PostsTable dir={ dir } /> );
			scrollToMiddle();
			const row = getRows()[ 0 ];
			await expect
				.poll( () => getComputedStyle( row, '::before' ).maskImage )
				.toBe(
					`linear-gradient(to ${ start }, rgba(0, 0, 0, 0), rgb(0, 0, 0))`
				);
			expect( getComputedStyle( row, '::after' ).maskImage ).toBe(
				`linear-gradient(to ${ end }, rgba(0, 0, 0, 0), rgb(0, 0, 0))`
			);

			await render( <PostsTable withActions dir={ dir } /> );
			scrollToMiddle();
			await expect
				.poll( () => getComputedStyle( getActionsHeader() ).maskImage )
				.toBe(
					`linear-gradient(to ${ end }, rgba(0, 0, 0, 0), rgb(0, 0, 0) ${ FADE_SIZE }px)`
				);
		}
	);

	// A fade that covers only its own space keeps its share of the row line,
	// and one that covers columns hides it, so their lines fade out.
	it( 'fades each edge only while there are columns to scroll to on its side', async () => {
		await render( <PostsTable /> );
		const row = getRows()[ 1 ];
		const getFade = ( pseudo: '::before' | '::after' ) => {
			const style = getComputedStyle( row, pseudo );
			return [ style.maskImage !== 'none', style.backgroundSize ];
		};

		await expect
			.poll( () => [ getFade( '::before' ), getFade( '::after' ) ] )
			.toEqual( [
				[ false, '100% 1px' ],
				[ true, '0px 0px' ],
			] );

		scrollToEnd();
		await expect
			.poll( () => [ getFade( '::before' ), getFade( '::after' ) ] )
			.toEqual( [
				[ true, '0px 0px' ],
				[ false, '100% 1px' ],
			] );
	} );

	it( 'does not fade when every column fits', async () => {
		await render( <PostsTable width={ 1600 } /> );

		// Wait for a frame, so a scroll timeline would have been resolved.
		await new Promise( requestAnimationFrame );
		const row = getRows()[ 1 ];
		expect( getComputedStyle( row, '::before' ).maskImage ).toBe( 'none' );
		expect( getComputedStyle( row, '::after' ).maskImage ).toBe( 'none' );
	} );

	describe( 'without actions', () => {
		// At the end of the scroll range, the fade must cover only its own
		// space, not the last column.
		it( 'keeps the space of the fade free after the last column', async () => {
			await render( <PostsTable /> );

			for ( const row of getRows() ) {
				const rowBox = row.getBoundingClientRect();
				const lastCell = row.lastElementChild!.getBoundingClientRect();
				expect( rowBox.right - lastCell.right ).toBe( FADE_SIZE );
			}
		} );

		it( 'aligns the header of an end-aligned last column with its cells', async () => {
			await render(
				<PostsTable
					width={ 1600 }
					styles={ { tags: { align: 'end' } } }
				/>
			);

			const header = document.querySelector(
				'thead th:last-child .dataviews-view-table-header-button'
			)!;
			const cells = document.querySelectorAll(
				'tbody td:last-child .dataviews-view-table__cell-content-wrapper'
			);
			expect( cells.length ).toBeGreaterThan( 0 );
			// The header button has a 1px border, as it had before the fade.
			for ( const cell of cells ) {
				expect(
					Math.abs( getTextRight( cell ) - getTextRight( header ) )
				).toBeLessThanOrEqual( 1 );
			}
		} );

		it( 'fades into the background of each row', async () => {
			const style = document.createElement( 'style' );
			style.textContent =
				'.dataviews-view-table tbody tr:first-child { background-color: rgb(1, 2, 3); }';
			document.head.append( style );
			try {
				await render( <PostsTable /> );

				const [ , firstRow, secondRow ] = getRows();
				expect(
					getComputedStyle( firstRow, '::after' ).backgroundColor
				).toBe( 'rgb(1, 2, 3)' );
				// Rows without their own background fade into the one of
				// DataViews, not into a transparent cell.
				expect(
					getComputedStyle( secondRow, '::after' ).backgroundColor
				).toBe(
					getComputedStyle(
						document.querySelector( '.dataviews-wrapper' )!
					).backgroundColor
				);
			} finally {
				style.remove();
			}
		} );

		it( 'does not add the fade cell when there are actions', async () => {
			await render( <PostsTable withActions /> );

			for ( const row of getRows() ) {
				expect( getComputedStyle( row, '::after' ).content ).toBe(
					'none'
				);
			}
		} );
	} );

	describe( 'leading edge', () => {
		// At the start of the scroll range, the fade must cover only its own
		// space, not the first column.
		it( 'keeps the space of the fade free before the first column', async () => {
			await render( <PostsTable /> );

			for ( const row of getRows() ) {
				const rowBox = row.getBoundingClientRect();
				const firstCell =
					row.firstElementChild!.getBoundingClientRect();
				expect( firstCell.left - rowBox.left ).toBe( FADE_SIZE );
			}
		} );

		it( 'aligns the header of the first column with its cells', async () => {
			await render( <PostsTable /> );

			const header = document.querySelector(
				'thead th:first-child .dataviews-view-table-header-button'
			)!;
			const cells = document.querySelectorAll(
				'tbody td:first-child .dataviews-view-table__cell-content-wrapper'
			);
			expect( cells.length ).toBeGreaterThan( 0 );
			// The header button has a 1px border, as it had before the fade.
			for ( const cell of cells ) {
				expect(
					Math.abs( getTextLeft( cell ) - getTextLeft( header ) )
				).toBeLessThanOrEqual( 1 );
			}
		} );
	} );
} );
