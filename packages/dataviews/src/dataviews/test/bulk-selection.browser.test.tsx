import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useState } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import DataViews from '../index';
import type { Action, Field, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
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

function SelectableTable( { isLoading = false } = {} ) {
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
			isLoading={ isLoading }
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

it( 'keeps loading bulk actions unfocusable over an opaque backing', async () => {
	const { rerender } = await render( <SelectableTable /> );
	const user = userEvent.setup();
	await user.click(
		page.getByRole( 'checkbox', { name: 'Select all', exact: true } )
	);
	const cancel = page
		.getByRole( 'button', { name: 'Cancel', exact: true } )
		.element();
	const table = page.getByRole( 'table' ).element();
	const toolbar = document.querySelector( '.dataviews-bulk-actions' )!;
	const overlay = toolbar.parentElement!;
	await rerender( <SelectableTable isLoading /> );
	cancel.focus();
	expect( cancel ).not.toHaveFocus();
	await expect
		.poll( () => {
			const style = getComputedStyle( table );
			return (
				style.animationName !== 'none' || Number( style.opacity ) < 1
			);
		} )
		.toBe( true );
	expect( getComputedStyle( overlay ).opacity ).toBe( '1' );
	expect( getComputedStyle( overlay ).animationName ).toBe( 'none' );
	const toolbarStyle = getComputedStyle( toolbar );
	expect(
		toolbarStyle.animationName !== 'none' ||
			Number( toolbarStyle.opacity ) < 1
	).toBe( true );
	const backing = getComputedStyle( overlay, '::before' );
	expect( backing.content ).toBe( '""' );
	expect( backing.backgroundColor ).toBe(
		getComputedStyle( toolbar ).backgroundColor
	);
	expect( backing.backgroundColor ).not.toBe( 'rgba(0, 0, 0, 0)' );
	await rerender( <SelectableTable /> );
	cancel.focus();
	expect( cancel ).toHaveFocus();
} );

it.each( [ 'balanced', 'compact', 'comfortable' ] as const )(
	'keeps the %s table toolbar aligned during scrolling and resizing',
	async ( density ) => {
		const data = Array.from( { length: 20 }, ( _, index ) => ( {
			...posts[ 0 ],
			id: String( index ),
			title: `Post ${ index }`,
		} ) );
		await render(
			<div style={ { height: 300 } }>
				<DataViews
					data={ data }
					fields={ fields }
					view={ {
						type: 'table',
						titleField: 'title',
						fields: [ 'author' ],
						layout: {
							density,
							styles: { author: { minWidth: '1400px' } },
						},
					} }
					onChangeView={ () => {} }
					actions={ actions }
					paginationInfo={ {
						totalItems: data.length,
						totalPages: 1,
					} }
					defaultLayouts={ { table: true } }
				/>
			</div>
		);
		const table = page.getByRole( 'table' ).element();
		const header = table.querySelector( 'thead' )!;
		const scroller = table.parentElement!;
		const firstRowTop = table
			.querySelector( 'tbody' )!
			.getBoundingClientRect().top;
		const user = userEvent.setup();
		await user.click(
			page.getByRole( 'checkbox', { name: 'Select all', exact: true } )
		);
		const toolbar = document.querySelector< HTMLDivElement >(
			'.dataviews-bulk-actions'
		)!;
		expect( table ).not.toContainElement( toolbar );
		expect(
			table.querySelector( 'tbody' )!.getBoundingClientRect().top
		).toBe( firstRowTop );

		for ( const width of [ 1280, 390 ] ) {
			await page.viewport( width, 900 );
			scroller.scrollTop = scroller.scrollHeight;
			scroller.scrollLeft = scroller.scrollWidth;
			expect( scroller.scrollTop ).toBeGreaterThan( 0 );
			expect( scroller.scrollLeft ).toBeGreaterThan( 0 );
			await expect
				.poll( () => toolbar.getBoundingClientRect().height )
				.toBe( header.getBoundingClientRect().height );
			await expect
				.poll( () => toolbar.getBoundingClientRect().top )
				.toBe( scroller.getBoundingClientRect().top );
			expect( toolbar.getBoundingClientRect().left ).toBe(
				scroller.getBoundingClientRect().left
			);
			expect( toolbar.getBoundingClientRect().width ).toBe(
				scroller.clientWidth
			);
			await expect
				.element(
					page.getByRole( 'button', { name: 'Cancel', exact: true } )
				)
				.toBeInViewport();
		}

		// Custom headers can change height after mount, independently of density.
		header.style.height = '96px';
		await expect
			.poll( () => toolbar.getBoundingClientRect().height )
			.toBe( 96 );
		await user.click(
			page.getByRole( 'button', { name: 'Cancel', exact: true } )
		);
		await expect
			.element(
				page.getByRole( 'checkbox', {
					name: 'Select all',
					exact: true,
				} )
			)
			.toHaveFocus();
	}
);

it( 'keeps a grid item checkbox below the sticky toolbar after arrow navigation and Tab', async () => {
	const data = Array.from( { length: 8 }, ( _, index ) => ( {
		...posts[ 0 ],
		id: String( index ),
		title: `Post ${ index }`,
	} ) );
	await render(
		<div style={ { height: 300, width: 400, overflow: 'auto' } }>
			<DataViews
				data={ data }
				fields={ [ fields[ 0 ] ] }
				view={ { type: 'grid', titleField: 'title', fields: [] } }
				onChangeView={ () => {} }
				onClickItem={ () => {} }
				actions={ actions }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				defaultLayouts={ { grid: true } }
			/>
		</div>
	);
	const user = userEvent.setup();
	page.getByRole( 'gridcell' ).first().element().focus();
	await user.keyboard( '{ArrowDown}{ArrowDown}{ArrowUp}{Tab}{Tab}' );
	const checkbox = page.getByRole( 'checkbox', {
		name: 'Post 1',
		exact: true,
	} );
	await expect.element( checkbox ).toHaveFocus();
	await expect
		.poll( () => {
			const header = document.querySelector(
				'.dataviews-view-grid__bulk-actions-header'
			)!;
			return (
				checkbox.element().getBoundingClientRect().top >=
				header.getBoundingClientRect().bottom
			);
		} )
		.toBe( true );
} );
