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

// `--wpds-dimension-padding-2xl`, the padding at the start of the rows, and
// at their end with actions.
const FADE_SIZE = 24;
// `--wpds-dimension-padding-3xl`, the padding at the end of the rows without
// actions, which an overlay scrollbar may cover.
const END_FADE_SIZE = 32;
// `--wpds-dimension-padding-2xl`, the width of the fade over the columns next
// to a covering cell.
const FADE_RAMP = 24;
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
// A fade is doubled in width only while it is active.
const isFading = ( style: CSSStyleDeclaration ) =>
	style.transform === 'matrix(2, 0, 0, 1, 0, 0)';
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

		it.each( [ 'ltr', 'rtl' ] as const )(
			'shows the divider until the end of the scroll range (%s)',
			async ( dir ) => {
				await render( <PostsTable withActions dir={ dir } /> );

				await expect.poll( getDividerOpacity ).toBe( '1' );

				scrollToEnd();
				await expect.poll( getDividerOpacity ).toBe( '0' );
			}
		);

		it( 'hides the divider when every column fits', async () => {
			await render( <PostsTable withActions width={ 1600 } /> );

			// Wait for a frame, so the scroll state would have been resolved.
			await new Promise( requestAnimationFrame );
			expect( getDividerOpacity() ).toBe( '0' );
		} );

		it.each( [ 'ltr', 'rtl' ] as const )(
			'covers the strip and fades the columns before it until the end of the scroll range (%s)',
			async ( dir ) => {
				await render( <PostsTable withActions dir={ dir } /> );
				const cell = getActionsCell();
				const getFadeOpacity = () =>
					getComputedStyle( cell, '::before' ).opacity;

				await expect.poll( getFadeOpacity ).toBe( '1' );
				const fade = getComputedStyle( cell, '::before' );
				// From the start of the fade over the columns to the divider.
				expect( fade.width ).toBe( `${ FADE_RAMP + FADE_SIZE }px` );
				expect( fade.insetInlineStart ).toBe( `-${ FADE_RAMP }px` );
				expect( fade.backgroundImage ).toBe(
					`linear-gradient(to ${
						dir === 'rtl' ? 'left' : 'right'
					}, rgba(0, 0, 0, 0), ${
						getComputedStyle( cell ).backgroundColor
					} ${ FADE_RAMP }px)`
				);

				scrollToEnd();
				await expect.poll( getFadeOpacity ).toBe( '0' );
			}
		);

		// Firefox moves the mask of a sticky cell behind the cell while
		// scrolling, which cuts the actions off.
		it( 'does not mask the actions', async () => {
			await render( <PostsTable withActions /> );
			scrollToMiddle();
			await expect
				.poll(
					() =>
						getComputedStyle( getActionsCell(), '::before' ).opacity
				)
				.toBe( '1' );

			for ( const cell of [ getActionsHeader(), getActionsCell() ] ) {
				const style = getComputedStyle( cell );
				expect( style.maskImage ).toBe( 'none' );
				expect(
					style.getPropertyValue( '-webkit-mask-box-image' ) || 'none'
				).toBe( 'none' );
			}
		} );
	} );

	// Every fade grows from the edge of the row over the columns next to it,
	// and fades out towards them.
	it.each( [
		[ 'ltr', 'left', 'right' ],
		[ 'rtl', 'right', 'left' ],
	] as const )(
		'fades from the edges of the rows (%s)',
		async ( dir, start, end ) => {
			await render( <PostsTable dir={ dir } /> );
			scrollToMiddle();
			const row = getRows()[ 1 ];
			await expect
				.poll( () => isFading( getComputedStyle( row, '::before' ) ) )
				.toBe( true );

			for ( const [ pseudo, edge ] of [
				[ '::before', start ],
				[ '::after', end ],
			] ) {
				const style = getComputedStyle( row, pseudo );
				expect( isFading( style ) ).toBe( true );
				expect( style.transformOrigin.split( ' ' )[ 0 ] ).toBe(
					edge === 'left' ? '0px' : style.width
				);
				// Transparent up to the ramp before the middle, then the
				// background of the row from the middle to the edge.
				expect( style.backgroundImage ).toBe(
					`linear-gradient(to ${ edge }, rgba(0, 0, 0, 0) calc(50% - ${
						FADE_RAMP / 2
					}px), ${ getComputedStyle( row ).backgroundColor } 50%)`
				);
			}
		}
	);

	// Firefox misplaces the mask of a sticky cell while scrolling, which
	// cuts it off.
	it( 'does not mask the fades', async () => {
		await render( <PostsTable /> );
		scrollToMiddle();
		const row = getRows()[ 1 ];
		await expect
			.poll( () => isFading( getComputedStyle( row, '::before' ) ) )
			.toBe( true );

		for ( const pseudo of [ '::before', '::after' ] ) {
			const style = getComputedStyle( row, pseudo );
			expect( style.maskImage ).toBe( 'none' );
			expect(
				style.getPropertyValue( '-webkit-mask-box-image' ) || 'none'
			).toBe( 'none' );
		}
	} );

	// A fade that covers only its own space keeps its share of the row line,
	// and one that covers columns hides it, so their lines fade out.
	it( 'fades each edge only while there are columns to scroll to on its side', async () => {
		await render( <PostsTable /> );
		const row = getRows()[ 1 ];
		const getFade = ( pseudo: '::before' | '::after' ) => {
			const style = getComputedStyle( row, pseudo );
			return [ isFading( style ), style.backgroundSize ];
		};

		await expect
			.poll( () => [ getFade( '::before' ), getFade( '::after' ) ] )
			.toEqual( [
				[ false, '100% 1px' ],
				[ true, 'auto' ],
			] );

		scrollToEnd();
		await expect
			.poll( () => [ getFade( '::before' ), getFade( '::after' ) ] )
			.toEqual( [
				[ true, 'auto' ],
				[ false, '100% 1px' ],
			] );
	} );

	// At rest the cells at the edges only paint their share of the row line,
	// so they do not cover what the columns next to them paint over their
	// space, like the focus ring of a checkbox.
	it.each( [ 'ltr', 'rtl' ] as const )(
		'only keeps the row line at rest (%s)',
		async ( dir ) => {
			await render( <PostsTable dir={ dir } width={ 1600 } /> );

			// Wait for a frame, so the scroll state would have been resolved.
			await new Promise( requestAnimationFrame );
			const row = getRows()[ 1 ];
			for ( const pseudo of [ '::before', '::after' ] ) {
				const style = getComputedStyle( row, pseudo );
				expect( style.backgroundColor ).toBe( 'rgba(0, 0, 0, 0)' );
				expect( style.backgroundImage ).toMatch(
					/^linear-gradient\(rgb[^)]*\), rgb[^)]*\)\)$/
				);
				expect( style.backgroundSize ).toBe( '100% 1px' );
				expect( style.transform ).toBe( 'none' );
			}
		}
	);

	it( 'does not fade when every column fits', async () => {
		await render( <PostsTable width={ 1600 } /> );

		// Wait for a frame, so the scroll state would have been resolved.
		await new Promise( requestAnimationFrame );
		const row = getRows()[ 1 ];
		expect( isFading( getComputedStyle( row, '::before' ) ) ).toBe( false );
		expect( isFading( getComputedStyle( row, '::after' ) ) ).toBe( false );
	} );

	describe( 'without actions', () => {
		// At the end of the scroll range, the fade must cover only its own
		// space, not the last column.
		it( 'keeps the space of the fade free after the last column', async () => {
			await render( <PostsTable /> );

			for ( const row of getRows() ) {
				const rowBox = row.getBoundingClientRect();
				const lastCell = row.lastElementChild!.getBoundingClientRect();
				expect( rowBox.right - lastCell.right ).toBe( END_FADE_SIZE );
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
				'.dataviews-view-table tbody tr:first-child { --dataviews-view-table-row-background: rgb(1, 2, 3); }';
			document.head.append( style );
			try {
				await render( <PostsTable /> );

				const [ , firstRow, secondRow ] = getRows();
				await expect
					.poll( () =>
						isFading( getComputedStyle( firstRow, '::after' ) )
					)
					.toBe( true );
				expect(
					getComputedStyle( firstRow, '::after' ).backgroundImage
				).toContain( 'rgb(1, 2, 3) 50%)' );
				// Rows without their own background fade into the one of
				// DataViews, not into a transparent cell.
				expect(
					getComputedStyle( secondRow, '::after' ).backgroundImage
				).toContain(
					`${
						getComputedStyle(
							document.querySelector( '.dataviews-wrapper' )!
						).backgroundColor
					} 50%)`
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

	// The cues follow classes that the table sets from its scroll position.
	describe( 'scroll position classes', () => {
		const getTableClasses = () => {
			const { classList } = document.querySelector(
				'.dataviews-view-table'
			)!;
			return {
				before: classList.contains( 'has-columns-before' ),
				after: classList.contains( 'has-columns-after' ),
			};
		};

		it.each( [ 'ltr', 'rtl' ] as const )(
			'tells which sides have columns to scroll to (%s)',
			async ( dir ) => {
				await render( <PostsTable withActions dir={ dir } /> );
				await expect
					.poll( getTableClasses )
					.toEqual( { before: false, after: true } );

				scrollToMiddle();
				await expect
					.poll( getTableClasses )
					.toEqual( { before: true, after: true } );

				scrollToEnd();
				await expect
					.poll( getTableClasses )
					.toEqual( { before: true, after: false } );
			}
		);

		it( 'updates when the table stops overflowing', async () => {
			const { rerender } = await render( <PostsTable withActions /> );
			await expect
				.poll( getTableClasses )
				.toEqual( { before: false, after: true } );

			await rerender( <PostsTable withActions width={ 1600 } /> );
			await expect
				.poll( getTableClasses )
				.toEqual( { before: false, after: false } );
		} );
	} );
} );
