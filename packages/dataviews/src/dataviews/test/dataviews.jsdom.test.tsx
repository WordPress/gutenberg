import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMemo, useState } from '@wordpress/element';
import DataViews from '../index';
import {
	LAYOUT_ACTIVITY,
	LAYOUT_GRID,
	LAYOUT_LIST,
	LAYOUT_TABLE,
} from '../../constants';
import type { Action, SupportedLayouts, View } from '../../types';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';

globalThis.wpVitest.mockMatchMedia();

globalThis.wpVitest.mockCSSSupports();
type Data = {
	id: number;
	title: string;
	author?: number;
	order?: number;
};

const DEFAULT_VIEW = {
	type: 'table' as const,
	search: '',
	page: 1,
	perPage: 10,
	layout: {},
	filters: [],
};

const defaultLayouts: SupportedLayouts = {
	[ LAYOUT_TABLE ]: true,
	[ LAYOUT_GRID ]: true,
	[ LAYOUT_LIST ]: true,
	[ LAYOUT_ACTIVITY ]: true,
};

const fields = [
	{
		id: 'title',
		label: 'Title',
		type: 'text' as const,
	},
	{
		id: 'order',
		label: 'Order',
		type: 'integer' as const,
	},
	{
		id: 'author',
		label: 'Author',
		type: 'integer' as const,
		elements: [
			{ value: 1, label: 'Jane' },
			{ value: 2, label: 'John' },
		],
	},
	{
		label: 'Image',
		id: 'image',
		render: ( { item }: { item: Data } ) => {
			return (
				<svg
					width="400"
					height="180"
					data-testid={ 'image-field-' + item.id }
				>
					<rect
						x="50"
						y="20"
						rx="20"
						ry="20"
						width="150"
						height="150"
						style={ { fill: 'red', opacity: 0.5 } }
					/>
				</svg>
			);
		},
		enableSorting: false,
	},
];

const actions: Action< Data >[] = [
	{
		id: 'delete',
		label: 'Delete',
		supportsBulk: true,
		RenderModal: () => <div>Modal Content</div>,
	},
];

const data: Data[] = [
	{
		id: 1,
		title: 'Hello World',
		author: 1,
		order: 1,
	},
	{
		id: 2,
		title: 'Homepage',
		author: 2,
		order: 1,
	},
	{
		id: 3,
		title: 'Posts',
		author: 2,
		order: 1,
	},
];

function DataViewWrapper( {
	view: additionalView,
	...props
}: Partial< Parameters< typeof DataViews< Data > >[ 0 ] > ) {
	const [ view, setView ] = useState< View >( {
		...DEFAULT_VIEW,
		fields: [ 'title', 'order', 'author' ],
		...additionalView,
	} );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, props.fields || fields );
	}, [ view, props.fields ] );

	const dataViewProps = {
		getItemId: ( item: Data ) => item.id.toString(),
		paginationInfo,
		data: shownData,
		view,
		fields,
		onChangeView: setView,
		actions: [],
		defaultLayouts,
		...props,
	};

	return <DataViews { ...dataViewProps } />;
}

// Tests run against a DataView which is 500px wide.
const mockUseViewportMatch = vi.fn(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	( _viewport: string, _operator: string ) => false
);
vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		useResizeObserver: vi.fn( ( callback ) => {
			setTimeout( () => {
				callback( [
					{
						borderBoxSize: [ { inlineSize: 500 } ],
					},
				] );
			}, 0 );
			return () => {};
		} ),
		useViewportMatch: ( viewport: string, operator: string ): boolean =>
			mockUseViewportMatch( viewport, operator ),
	} as unknown as typeof original;
} );

describe( 'DataViews component', () => {
	it( 'should show "No results" if data is empty', () => {
		render( <DataViewWrapper data={ [] } /> );
		expect( screen.getByText( 'No results' ) ).toBeInTheDocument();
	} );

	it( 'orders and indents loaded items from their parent ids', () => {
		render(
			<DataViewWrapper
				data={ [
					{ id: 2, title: 'Child' },
					{ id: 1, title: 'Parent' },
				] }
				getItemParentId={ ( item ) =>
					item.id === 2 ? 1 : undefined
				}
				view={ {
					...DEFAULT_VIEW,
					fields: [],
					showLevels: true,
					titleField: 'title',
				} }
			/>
		);

		const rows = screen.getAllByRole( 'row' ).slice( 1 );
		expect( rows[ 0 ] ).toHaveTextContent( 'Parent' );
		expect( rows[ 1 ] ).toHaveTextContent( '— Child' );
	} );

	it( 'hides loaded descendants of collapsed items', () => {
		render(
			<DataViewWrapper
				data={ [
					{ id: 2, title: 'Child' },
					{ id: 1, title: 'Parent' },
				] }
				getItemParentId={ ( item ) =>
					item.id === 2 ? 1 : undefined
				}
				getItemHasChildren={ ( item ) => item.id === 1 }
				expandedItemIds={ [] }
				onChangeExpandedItemIds={ vi.fn() }
				view={ {
					...DEFAULT_VIEW,
					fields: [],
					showLevels: true,
					titleField: 'title',
				} }
			/>
		);

		expect( screen.getByText( 'Parent' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Child' ) ).not.toBeInTheDocument();
	} );

	it( 'emits controlled expanded item ids from a row disclosure', async () => {
		const user = userEvent.setup();
		const onChangeExpandedItemIds = vi.fn();
		render(
			<DataViewWrapper
				data={ [
					{ id: 2, title: 'Child' },
					{ id: 1, title: 'Parent' },
				] }
				getItemParentId={ ( item ) =>
					item.id === 2 ? 1 : undefined
				}
				getItemHasChildren={ ( item ) => item.id === 1 }
				expandedItemIds={ [] }
				onChangeExpandedItemIds={ onChangeExpandedItemIds }
				view={ {
					...DEFAULT_VIEW,
					fields: [],
					showLevels: true,
					titleField: 'title',
				} }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Expand Parent' } )
		);
		expect( onChangeExpandedItemIds ).toHaveBeenCalledWith( [ '1' ] );
	} );

	it( 'keeps unknown items expandable and hides disclosure for known leaves', () => {
		render(
			<DataViewWrapper
				data={ [
					{ id: 1, title: 'Unknown' },
					{ id: 2, title: 'Leaf' },
				] }
				getItemParentId={ () => undefined }
				getItemHasChildren={ ( item ) =>
					item.id === 1 ? undefined : false
				}
				expandedItemIds={ [] }
				onChangeExpandedItemIds={ vi.fn() }
				view={ {
					...DEFAULT_VIEW,
					fields: [],
					showLevels: true,
					titleField: 'title',
				} }
			/>
		);

		expect(
			screen.getByRole( 'button', { name: 'Expand Unknown' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Expand Leaf' } )
		).not.toBeInTheDocument();
	} );

	it( 'toggles all loaded parents without changing unloaded items', async () => {
		const user = userEvent.setup();
		const onChangeExpandedItemIds = vi.fn();
		const hierarchyProps = {
			data: [
				{ id: 2, title: 'Child' },
				{ id: 1, title: 'Parent' },
			],
			getItemParentId: ( item: Data ) =>
				item.id === 2 ? 1 : undefined,
			getItemHasChildren: ( item: Data ) => item.id === 1,
			onChangeExpandedItemIds,
			view: {
				...DEFAULT_VIEW,
				fields: [],
				showLevels: true,
				titleField: 'title',
			},
		};
		const { rerender } = render(
			<DataViewWrapper
				{ ...hierarchyProps }
				expandedItemIds={ [ 'unloaded' ] }
			/>
		);

		const expandAll = screen.getByRole( 'button', {
			name: 'Expand all',
		} );
		expect( expandAll ).not.toHaveAttribute( 'aria-expanded' );
		await user.click( expandAll );
		expect( onChangeExpandedItemIds ).toHaveBeenCalledWith( [
			'unloaded',
			'1',
		] );

		onChangeExpandedItemIds.mockClear();
		rerender(
			<DataViewWrapper
				{ ...hierarchyProps }
				expandedItemIds={ [ 'unloaded', '1' ] }
			/>
		);
		expect( screen.getByText( 'Hierarchy level 2' ) ).toBeInTheDocument();
		const collapseAll = screen.getByRole( 'button', {
			name: 'Collapse all',
		} );
		expect( collapseAll ).not.toHaveAttribute( 'aria-expanded' );
		await user.click( collapseAll );
		expect( onChangeExpandedItemIds ).toHaveBeenCalledWith( [
			'unloaded',
		] );
	} );

	it( 'renders independent continuations after loaded subtrees', async () => {
		const user = userEvent.setup();
		const onLoadMore = vi.fn();
		const onChangeView = vi.fn();
		const hierarchyData = [
			{ id: 3, title: 'Grandchild' },
			{ id: 2, title: 'Child B' },
			{ id: 1, title: 'Parent A' },
			{ id: 4, title: 'Root D' },
		];
		const renderDataView = (
			items: typeof hierarchyData,
			hasParentContinuation = true
		) => (
			<DataViewWrapper
				actions={ actions }
				data={ items }
				getItemParentId={ ( item ) => {
					if ( item.id === 2 || item.id === 5 ) {
						return 1;
					}
					return item.id === 3 ? 2 : undefined;
				} }
				getItemHasChildren={ ( item ) => item.id < 3 }
				expandedItemIds={ [ '1', '2' ] }
				onChangeExpandedItemIds={ vi.fn() }
				hierarchyPagination={ {
					getPaginationInfo: ( parentId ) => {
						if ( parentId === '2' ) {
							return { hasMore: true, isLoading: true };
						}
						return {
							hasMore:
								parentId === '1' ? hasParentContinuation : true,
						};
					},
					onLoadMore,
				} }
				onChangeView={ onChangeView }
				paginationInfo={ { totalItems: 100, totalPages: 10 } }
				view={ {
					...DEFAULT_VIEW,
					page: 15,
					fields: [],
					groupBy: { field: 'missing', direction: 'asc' },
					showLevels: true,
					titleField: 'title',
					infiniteScrollEnabled: true,
				} }
			/>
		);
		const { rerender } = render( renderDataView( hierarchyData ) );

		const rows = screen.getAllByRole( 'row' );
		expect( rows[ 1 ] ).toHaveTextContent( 'Parent A' );
		expect( rows[ 2 ] ).toHaveTextContent( 'Child B' );
		expect( rows[ 3 ] ).toHaveTextContent( 'Grandchild' );
		expect( rows[ 4 ] ).toHaveTextContent( 'Loading…' );
		expect( rows[ 5 ] ).toHaveTextContent( 'Load more' );
		expect( rows[ 6 ] ).toHaveTextContent( 'Root D' );
		expect( rows[ 7 ] ).toHaveTextContent( 'Load more' );

		const childContinuation = screen.getByRole( 'button', {
			name: 'Loading children of Child B',
		} );
		expect( childContinuation ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( childContinuation ).toHaveAttribute( 'aria-busy', 'true' );
		const parentContinuation = screen.getByRole( 'button', {
			name: 'Load more children of Parent A',
		} );
		await user.click( parentContinuation );
		await user.click(
			screen.getByRole( 'button', { name: 'Load more items' } )
		);
		expect( onLoadMore.mock.calls ).toEqual( [ [ '1' ], [ null ] ] );

		expect(
			screen.queryByRole( 'button', { name: 'Next page' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'table' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'article' ) ).not.toBeInTheDocument();
		expect( screen.getByText( '4 Items' ) ).toBeInTheDocument();
		await user.click(
			screen.getByRole( 'button', { name: 'View options' } )
		);
		expect(
			screen.queryByText( 'Items per page' )
		).not.toBeInTheDocument();
		expect( onChangeView ).not.toHaveBeenCalled();

		parentContinuation.focus();
		rerender(
			renderDataView( [
				...hierarchyData,
				{ id: 5, title: 'New child' },
			] )
		);
		expect(
			screen.getByRole( 'button', {
				name: 'Load more children of Parent A',
			} )
		).toHaveFocus();

		rerender(
			renderDataView(
				[ ...hierarchyData, { id: 5, title: 'New child' } ],
				false
			)
		);
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', {
					name: 'Collapse Parent A',
				} )
			).toHaveFocus()
		);
	} );

	it( 'keeps an empty root error retryable', async () => {
		const user = userEvent.setup();
		const onLoadMore = vi.fn();
		const hierarchyProps = {
			data: [],
			getItemParentId: () => undefined,
			getItemHasChildren: () => undefined,
			expandedItemIds: [],
			onChangeExpandedItemIds: vi.fn(),
			paginationInfo: { totalItems: 0, totalPages: 0 },
			view: {
				...DEFAULT_VIEW,
				fields: [],
				showLevels: true,
				titleField: 'title',
			},
		};
		const { rerender } = render(
			<DataViewWrapper
				{ ...hierarchyProps }
				hierarchyPagination={ {
					getPaginationInfo: () => ( {
						hasMore: false,
						error: 'Pages could not be loaded.',
					} ),
					onLoadMore,
				} }
			/>
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'Pages could not be loaded.'
		);
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
		await user.click(
			screen.getByRole( 'button', { name: 'Retry loading items' } )
		);
		expect( onLoadMore ).toHaveBeenCalledWith( null );

		rerender(
			<DataViewWrapper
				{ ...hierarchyProps }
				hierarchyPagination={ {
					getPaginationInfo: () => ( { hasMore: false } ),
					onLoadMore,
				} }
			/>
		);
		await waitFor( () =>
			expect( screen.getByRole( 'status' ) ).toHaveFocus()
		);
	} );

	it( 'keeps getItemLevel indentation when no parent callback exists', () => {
		render(
			<DataViewWrapper
				data={ [
					{ id: 1, title: 'Parent' },
					{ id: 2, title: 'Child' },
				] }
				getItemLevel={ ( item ) => item.id - 1 }
				view={ {
					...DEFAULT_VIEW,
					fields: [],
					showLevels: true,
					titleField: 'title',
				} }
			/>
		);

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
	} );

	it( 'should filter results by "search" text, if field has enableGlobalSearch set to true', async () => {
		const fieldsWithSearch = [
			{
				...fields[ 0 ],
				enableGlobalSearch: true,
			},
			fields[ 1 ],
		];
		render(
			<DataViewWrapper
				fields={ fieldsWithSearch }
				view={ { ...DEFAULT_VIEW, search: 'Hello' } }
			/>
		);
		// Row count includes header.
		expect( screen.getAllByRole( 'row' ).length ).toEqual( 2 );
		expect( screen.getByText( 'Hello World' ) ).toBeInTheDocument();
	} );

	it( 'should display matched element label if field contains elements list', () => {
		render(
			<DataViewWrapper
				data={ [ { id: 1, author: 3, title: 'Hello World' } ] }
				fields={ [
					{
						id: 'author',
						label: 'Author',
						type: 'integer' as const,
						elements: [
							{ value: 1, label: 'Jane' },
							{ value: 2, label: 'John' },
							{ value: 3, label: 'Tim' },
						],
					},
				] }
			/>
		);
		expect( screen.getByText( 'Tim' ) ).toBeInTheDocument();
	} );

	it( 'should render custom render function if defined in field definition', () => {
		render(
			<DataViewWrapper
				data={ [ { id: 1, title: 'Test Title' } ] }
				fields={ [
					{
						id: 'title',
						label: 'Title',
						type: 'text' as const,
						render: ( { item }: { item: Data } ) => {
							return item.title?.toUpperCase();
						},
					},
				] }
			/>
		);
		expect( screen.getByText( 'TEST TITLE' ) ).toBeInTheDocument();
	} );

	describe( 'page clamping', () => {
		it( 'moves the view to the last page when it points past the end of the collection', async () => {
			const onChangeView = vi.fn();
			// Three items, one per page: page 5 doesn't exist.
			render(
				<DataViewWrapper
					view={ { type: LAYOUT_TABLE, page: 5, perPage: 1 } }
					onChangeView={ onChangeView }
				/>
			);

			await waitFor( () => {
				expect( onChangeView ).toHaveBeenCalledWith(
					expect.objectContaining( { page: 3, perPage: 1 } )
				);
			} );
		} );

		it( 'falls back to the first page when the collection is empty', async () => {
			const onChangeView = vi.fn();
			render(
				<DataViewWrapper
					view={ { type: LAYOUT_TABLE, page: 2 } }
					data={ [] }
					paginationInfo={ { totalItems: 0, totalPages: 0 } }
					onChangeView={ onChangeView }
				/>
			);

			await waitFor( () => {
				expect( onChangeView ).toHaveBeenCalledWith(
					expect.objectContaining( { page: 1 } )
				);
			} );
		} );

		it( 'leaves the page alone while loading', () => {
			const onChangeView = vi.fn();
			render(
				<DataViewWrapper
					view={ { type: LAYOUT_TABLE, page: 5, perPage: 1 } }
					isLoading
					onChangeView={ onChangeView }
				/>
			);

			expect( onChangeView ).not.toHaveBeenCalled();
		} );

		it( 'leaves the page alone when the total is unknown', () => {
			const onChangeView = vi.fn();
			render(
				<DataViewWrapper
					view={ { type: LAYOUT_TABLE, page: 5, perPage: 1 } }
					paginationInfo={
						{ totalItems: null, totalPages: null } as any
					}
					onChangeView={ onChangeView }
				/>
			);

			expect( onChangeView ).not.toHaveBeenCalled();
		} );

		it( 'leaves a valid page alone', () => {
			const onChangeView = vi.fn();
			render(
				<DataViewWrapper
					view={ { type: LAYOUT_TABLE, page: 3, perPage: 1 } }
					onChangeView={ onChangeView }
				/>
			);

			expect( onChangeView ).not.toHaveBeenCalled();
		} );
	} );
	describe( 'in table view', () => {
		it( 'should display columns for each field', () => {
			render( <DataViewWrapper /> );
			const displayedColumnFields = fields.filter( ( field ) =>
				[ 'title', 'order', 'author' ].includes( field.id )
			);
			for ( const field of displayedColumnFields ) {
				expect(
					screen.getByRole( 'button', { name: field.label } )
				).toBeInTheDocument();
			}
		} );

		it( 'should display the passed in data', () => {
			render( <DataViewWrapper /> );
			for ( const item of data ) {
				expect(
					screen.getAllByText( item.title )[ 0 ]
				).toBeInTheDocument();
			}
		} );

		it( 'should not render a column for a field id without a field definition', () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'title', 'missing', 'order' ],
					} }
				/>
			);

			const headers = screen.getAllByRole( 'columnheader' );
			expect( headers ).toHaveLength( 2 );
			expect(
				within( headers[ 0 ] ).getByRole( 'button', { name: 'Title' } )
			).toBeInTheDocument();
			expect(
				within( headers[ 1 ] ).getByRole( 'button', { name: 'Order' } )
			).toBeInTheDocument();

			// The header row plus one row per item.
			const rows = screen.getAllByRole( 'row' );
			expect( rows ).toHaveLength( data.length + 1 );
			for ( const row of rows.slice( 1 ) ) {
				expect( within( row ).getAllByRole( 'cell' ) ).toHaveLength(
					2
				);
			}
		} );

		it( 'should move a column past a field id without a field definition', async () => {
			const user = userEvent.setup();
			const onChangeView = vi.fn();
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'title', 'missing', 'order' ],
					} }
					onChangeView={ onChangeView }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Title' } ) );
			await user.click(
				await screen.findByRole( 'menuitem', { name: 'Move right' } )
			);

			// The move is computed against the rendered columns, so the
			// title lands after the order column rather than swapping places
			// with the skipped id, which is dropped from the view.
			expect( onChangeView ).toHaveBeenCalledWith(
				expect.objectContaining( { fields: [ 'order', 'title' ] } )
			);
		} );

		it( 'should display title column if defined using titleField', () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'order', 'author' ],
						titleField: 'title',
					} }
				/>
			);
			for ( const item of data ) {
				expect(
					screen.getAllByText( item.title )[ 0 ]
				).toBeInTheDocument();
			}
		} );

		it( 'should render actions column if actions are supported and passed in', () => {
			render( <DataViewWrapper actions={ actions } /> );
			expect( screen.getByText( 'Actions' ) ).toBeInTheDocument();
		} );

		it( 'should trigger the onClickItem callback if isItemClickable returns true and title field is clicked', async () => {
			const onClickItemCallback = vi.fn();

			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					actions={ actions }
					isItemClickable={ () => true }
					renderItemLink={ ( { item, ...props } ) => (
						<button
							// @ts-expect-error The spread `props.onClick` may be an anchor handler, not a button one.
							onClick={ ( event ) => {
								event.preventDefault();
								onClickItemCallback( item );
							} }
							{ ...props }
						/>
					) }
				/>
			);
			const titleField = screen.getByText( data[ 0 ].title );
			const user = userEvent.setup();
			await user.click( titleField );
			expect( onClickItemCallback ).toHaveBeenCalledWith( data[ 0 ] );
		} );

		it( 'accepts ctrl/cmd key and click for non-consecutive multi-selection', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const firstItemElement = screen.getByText( data[ 0 ].title );
			const thirdItemElement = screen.getByText( data[ 2 ].title );
			const user = userEvent.setup();
			await user.keyboard( '{Control>}' );
			await user.click( firstItemElement );

			// First item should be selected.
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();
			await user.click( thirdItemElement );

			// Both items should be selected.
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();
			expect(
				screen.getByRole( 'checkbox', { name: data[ 2 ].title } )
			).toBeChecked();

			// Don't keep the modifier pressed down, that's just mean.
			await user.keyboard( '{/Control}' );
		} );

		it( 'accepts shift key and click for range selection', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const user = userEvent.setup();
			// Ctrl/Cmd+Click selects the first item and makes it the anchor.
			await user.keyboard( '{Control>}' );
			await user.click( screen.getByText( data[ 0 ].title ) );
			await user.keyboard( '{/Control}' );
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();

			// Shift+Click selects everything between the anchor and the
			// clicked item.
			await user.keyboard( '{Shift>}' );
			await user.click( screen.getByText( data[ 2 ].title ) );
			for ( const item of data ) {
				expect(
					screen.getByRole( 'checkbox', { name: item.title } )
				).toBeChecked();
			}

			await user.keyboard( '{/Shift}' );
		} );

		it( 'keeps the existing selection when shift-clicking a range', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const user = userEvent.setup();
			// Checkbox clicks select the first and third items; the third
			// becomes the anchor.
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			);
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 2 ].title } )
			);

			// Shift+Click applies the anchor's state to the range without
			// touching the selection outside of it: the first item stays
			// selected.
			await user.keyboard( '{Shift>}' );
			await user.click( screen.getByText( data[ 1 ].title ) );
			await user.keyboard( '{/Shift}' );
			for ( const item of data ) {
				expect(
					screen.getByRole( 'checkbox', { name: item.title } )
				).toBeChecked();
			}
		} );

		it( 'selects the range when shift-clicking a selected item', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const user = userEvent.setup();
			await user.click(
				screen.getAllByRole( 'checkbox', { name: 'Select all' } )[ 0 ]
			);
			// Unchecking the third item makes it the anchor.
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 2 ].title } )
			);

			// Shift-clicking the selected second item selects the range
			// between the anchor and it rather than deselecting it.
			await user.keyboard( '{Shift>}' );
			await user.click( screen.getByText( data[ 1 ].title ) );
			await user.keyboard( '{/Shift}' );
			for ( const item of data ) {
				expect(
					screen.getByRole( 'checkbox', { name: item.title } )
				).toBeChecked();
			}
		} );

		it( 'selects the range when shift-clicking after deselecting an item', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const user = userEvent.setup();
			// Selecting and deselecting the first item leaves it as the
			// anchor with nothing selected.
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			);
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			);

			// Shift-clicking the unselected third item selects the whole
			// range from the anchor.
			await user.keyboard( '{Shift>}' );
			await user.click( screen.getByText( data[ 2 ].title ) );
			await user.keyboard( '{/Shift}' );
			for ( const item of data ) {
				expect(
					screen.getByRole( 'checkbox', { name: item.title } )
				).toBeChecked();
			}
		} );

		it( 'keeps the checkbox in sync when shift-clicking the checkbox itself', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const user = userEvent.setup();
			// The checkbox click selects the third item and makes it the
			// anchor.
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 2 ].title } )
			);

			// Shift-clicking the first item's checkbox selects the whole
			// range, and the clicked checkbox itself must reflect the new
			// state: cancelling the click would revert the input's native
			// toggle after React re-renders, leaving it visually unchecked.
			await user.keyboard( '{Shift>}' );
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			);
			await user.keyboard( '{/Shift}' );
			for ( const item of data ) {
				expect(
					screen.getByRole( 'checkbox', { name: item.title } )
				).toBeChecked();
			}
		} );

		it( 'swallows modifier clicks on non-selectable items and skips them in ranges', async () => {
			const onClickItem = vi.fn();
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					actions={ [
						{
							id: 'delete',
							label: 'Delete',
							supportsBulk: true,
							// The second item is not selectable.
							isEligible: ( item: Data ) => item.id !== 2,
							RenderModal: () => <div>Modal Content</div>,
						},
					] }
					isItemClickable={ () => true }
					onClickItem={ onClickItem }
				/>
			);
			const user = userEvent.setup();
			// Ctrl/Cmd+Click on a non-selectable item is swallowed: it
			// neither changes the selection nor activates the item's title.
			await user.keyboard( '{Control>}' );
			await user.click( screen.getByText( data[ 1 ].title ) );
			expect( onClickItem ).not.toHaveBeenCalled();
			expect(
				screen.getByRole( 'checkbox', { name: data[ 1 ].title } )
			).not.toBeChecked();

			// Selectable items still respond and become the anchor.
			await user.click( screen.getByText( data[ 0 ].title ) );
			await user.keyboard( '{/Control}' );
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();

			// Shift+Click ranges skip the non-selectable item.
			await user.keyboard( '{Shift>}' );
			await user.click( screen.getByText( data[ 2 ].title ) );
			await user.keyboard( '{/Shift}' );
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();
			expect(
				screen.getByRole( 'checkbox', { name: data[ 1 ].title } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'checkbox', { name: data[ 2 ].title } )
			).toBeChecked();
			expect( onClickItem ).not.toHaveBeenCalled();
		} );

		it( 'passes only eligible items to a bulk action callback', async () => {
			const restore = vi.fn();
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						fields: [ 'author' ],
						titleField: 'title',
					} }
					actions={ [
						{
							id: 'restore',
							label: 'Restore',
							supportsBulk: true,
							// Only the first item can be restored.
							isEligible: ( item: Data ) => item.id === 1,
							callback: restore,
						},
						{
							id: 'trash',
							label: 'Trash',
							supportsBulk: true,
							// Makes the second item selectable even though it
							// is not eligible for the restore action.
							isEligible: ( item: Data ) => item.id !== 1,
							callback: vi.fn(),
						},
					] }
				/>
			);
			const user = userEvent.setup();
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			);
			await user.click(
				screen.getByRole( 'checkbox', { name: data[ 1 ].title } )
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Restore' } )
			);

			expect( restore ).toHaveBeenCalledTimes( 1 );
			expect(
				restore.mock.calls[ 0 ][ 0 ].map( ( item: Data ) => item.id )
			).toEqual( [ 1 ] );
		} );
	} );

	describe( 'in grid view', () => {
		it( 'should display the passed in data', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
					} }
				/>
			);
			await waitFor( () => {
				for ( const item of data ) {
					expect(
						screen.getAllByText( item.title )[ 0 ]
					).toBeInTheDocument();
				}
			} );
		} );

		it( 'should render mediaField if defined', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
						mediaField: 'image',
					} }
				/>
			);
			await waitFor( () => {
				for ( const item of data ) {
					expect(
						screen.getByTestId( 'image-field-' + item.id )
					).toBeInTheDocument();
				}
			} );
		} );

		it( 'should render actions dropdown if actions are supported and passed in for each grid item', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
					} }
					actions={ actions }
				/>
			);
			expect(
				(
					await screen.findAllByRole( 'button', {
						name: 'Actions',
					} )
				).length
			).toEqual( 3 );
		} );

		it( 'should trigger the onClickItem callback if isItemClickable returns true and a media field is clicked', async () => {
			const mediaClickItemCallback = vi.fn();

			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
						mediaField: 'image',
					} }
					actions={ actions }
					isItemClickable={ () => true }
					renderItemLink={ ( { item, ...props } ) => (
						<button
							// @ts-expect-error The spread `props.onClick` may be an anchor handler, not a button one.
							onClick={ ( event ) => {
								event.preventDefault();
								mediaClickItemCallback( item );
							} }
							{ ...props }
						/>
					) }
				/>
			);
			const imageField = screen.getByTestId(
				'image-field-' + data[ 0 ].id
			);
			const user = userEvent.setup();
			await user.click( imageField );
			expect( mediaClickItemCallback ).toHaveBeenCalledWith( data[ 0 ] );
		} );

		it( 'labels the clickable media area with the title when the title is hidden', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
						titleField: 'title',
						mediaField: 'image',
						showTitle: false,
					} }
					isItemClickable={ () => true }
					onClickItem={ () => {} }
				/>
			);
			await waitFor( () => {
				for ( const item of data ) {
					expect(
						screen.getByRole( 'button', { name: item.title } )
					).toBeInTheDocument();
				}
			} );
			expect(
				screen.queryByRole( 'button', { name: 'Navigate to item' } )
			).not.toBeInTheDocument();
		} );

		it( 'labels the clickable media area by the visible title when the title is shown', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
						titleField: 'title',
						mediaField: 'image',
					} }
					isItemClickable={ () => true }
					onClickItem={ () => {} }
				/>
			);
			// Both the media area and the title are clickable and share the
			// name; the media area points at the rendered title
			// (`aria-labelledby`) rather than carrying a label of its own.
			const mediaButton = (
				await screen.findAllByRole( 'button', {
					name: data[ 0 ].title,
				} )
			).find( ( button ) =>
				button.classList.contains( 'dataviews-view-grid__media' )
			);
			expect( mediaButton ).toHaveAttribute( 'aria-labelledby' );
			expect( mediaButton ).not.toHaveAttribute( 'aria-label' );
		} );

		it( 'accepts checkbox click for selection', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						type: 'grid',
						fields: [ 'author' ],
						titleField: 'title',
						mediaField: 'image',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
				/>
			);
			const firstCheckbox = screen.getByRole( 'checkbox', {
				name: data[ 0 ].title,
			} );
			const thirdCheckbox = screen.getByRole( 'checkbox', {
				name: data[ 2 ].title,
			} );
			const user = userEvent.setup();
			await user.click( firstCheckbox );

			// First item should be selected.
			expect( firstCheckbox ).toBeChecked();
			await user.click( thirdCheckbox );

			// Both items should be selected (checkboxes toggle independently).
			expect( firstCheckbox ).toBeChecked();
			expect( thirdCheckbox ).toBeChecked();
		} );

		it( 'accepts ctrl/cmd key and click for multi-selection', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						type: 'grid',
						fields: [ 'author' ],
						titleField: 'title',
						mediaField: 'image',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
					isItemClickable={ () => false }
				/>
			);
			// Click on the gridcell directly (not wrapped in ItemClickWrapper)
			const firstItemCard = screen.getByRole( 'gridcell', {
				name: /Hello World/,
			} );
			const user = userEvent.setup();
			await user.keyboard( '{Control>}' );
			await user.click( firstItemCard );

			// First item should be selected.
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();

			await user.keyboard( '{/Control}' );
		} );

		it( 'accepts shift key and click for range selection', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						type: 'grid',
						fields: [ 'author' ],
						titleField: 'title',
						mediaField: 'image',
					} }
					// A bulk action is required for the dataview to be multi-selectable.
					actions={ actions }
					isItemClickable={ () => false }
				/>
			);
			const user = userEvent.setup();
			// Ctrl/Cmd+Click selects the first item and makes it the anchor.
			await user.keyboard( '{Control>}' );
			await user.click(
				screen.getByRole( 'gridcell', { name: /Hello World/ } )
			);
			await user.keyboard( '{/Control}' );
			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toBeChecked();

			// Shift+Click selects everything between the anchor and the
			// clicked item.
			await user.keyboard( '{Shift>}' );
			await user.click(
				screen.getByRole( 'gridcell', { name: /Posts/ } )
			);
			await user.keyboard( '{/Shift}' );
			for ( const item of data ) {
				expect(
					screen.getByRole( 'checkbox', { name: item.title } )
				).toBeChecked();
			}
		} );

		it( 'supports tabbing to selection and actions when title is visible', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						type: 'grid',
						fields: [],
						mediaField: 'image',
						titleField: 'title',
					} }
					isItemClickable={ () => true }
					actions={ actions }
				/>
			);

			// Double check that the title is being rendered.
			expect( screen.getByText( data[ 0 ].title ) ).toBeInTheDocument();

			const viewOptionsButton = screen.getByRole( 'button', {
				name: 'View options',
			} );

			const user = userEvent.setup();

			// Double click to open and then close view options. This is performed
			// instead of a direct .focus() so that effects have time to complete.
			await user.click( viewOptionsButton );
			await user.click( viewOptionsButton );

			await user.tab();
			await user.tab();

			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toHaveFocus();

			await user.tab();

			expect(
				screen.getAllByRole( 'button', { name: 'Actions' } )[ 0 ]
			).toHaveFocus();
		} );

		it( 'supports tabbing to selection and actions when title is not visible', async () => {
			render(
				<DataViewWrapper
					view={ {
						...DEFAULT_VIEW,
						type: 'grid',
						fields: [],
						mediaField: 'image',
						titleField: 'title',
						showTitle: false,
					} }
					isItemClickable={ () => true }
					actions={ actions }
				/>
			);

			// Double check that the title is not being rendered.
			expect(
				screen.queryByText( data[ 0 ].title )
			).not.toBeInTheDocument();

			const viewOptionsButton = screen.getByRole( 'button', {
				name: 'View options',
			} );

			const user = userEvent.setup();

			// Double click to open and then close view options. This is performed
			// instead of a direct .focus() so that effects have time to complete.
			await user.click( viewOptionsButton );
			await user.click( viewOptionsButton );
			await user.tab();
			await user.tab();

			expect(
				screen.getByRole( 'checkbox', { name: data[ 0 ].title } )
			).toHaveFocus();

			await user.tab();

			expect(
				screen.getAllByRole( 'button', { name: 'Actions' } )[ 0 ]
			).toHaveFocus();
		} );

		it( 'accepts an invalid previewSize and the preview size picker falls back to another size', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'grid',
						mediaField: 'image',
						layout: { previewSize: 13 },
					} }
				/>
			);
			const user = userEvent.setup();
			await user.click(
				screen.getByRole( 'button', { name: 'View options' } )
			);
			const previewSizeSlider = screen.getByRole( 'slider', {
				name: 'Preview size',
			} );
			expect( previewSizeSlider ).toBeInTheDocument();
			expect( previewSizeSlider ).toHaveValue( '0' ); // Falls back to the smallest size, which is the first one.
		} );

		describe( 'media fit', () => {
			// `layout` is loosely typed so the invalid-value case below can
			// pass something the `mediaFit` union rejects.
			const renderGrid = (
				layout: Record< string, unknown > = {},
				props = {},
				view: Record< string, unknown > = {}
			) =>
				render(
					<DataViewWrapper
						view={
							{
								type: 'grid',
								mediaField: 'image',
								layout,
								...view,
							} as unknown as View
						}
						{ ...props }
					/>
				);

			const optedIn = {
				config: {
					perPageSizes: [ 10, 20 ],
					mediaFitControl: true,
				},
			};

			const queryControl = async () => {
				const user = userEvent.setup();
				await user.click(
					screen.getByRole( 'button', { name: 'View options' } )
				);
				return screen.queryByRole( 'checkbox', {
					name: 'Original aspect ratio',
				} );
			};

			// The standard (non-infinite-scroll) grid root, which carries the
			// class the previews are styled from.
			const getGrid = () => screen.getByRole( 'grid' );

			it( 'crops previews by default', async () => {
				renderGrid();
				await waitFor( () =>
					expect( getGrid() ).not.toHaveClass(
						'has-media-fit-contain'
					)
				);
			} );

			it( 'fits previews when configured to contain', async () => {
				renderGrid( { mediaFit: 'contain' } );
				await waitFor( () =>
					expect( getGrid() ).toHaveClass( 'has-media-fit-contain' )
				);
			} );

			it( 'ignores an unsupported value and falls back to cropping', async () => {
				renderGrid( { mediaFit: 'fill' } );
				await waitFor( () =>
					expect( getGrid() ).not.toHaveClass(
						'has-media-fit-contain'
					)
				);
			} );

			it( 'hides the control unless the consumer opts in', async () => {
				renderGrid();
				expect( await queryControl() ).not.toBeInTheDocument();
			} );

			it( 'hides the control when the view is not showing media', async () => {
				renderGrid( {}, optedIn, { showMedia: false } );
				expect( await queryControl() ).not.toBeInTheDocument();
			} );

			it( 'hides the control when the media field is not one of the fields', async () => {
				renderGrid( {}, optedIn, { mediaField: 'not-a-field' } );
				expect( await queryControl() ).not.toBeInTheDocument();
			} );

			it( 'toggles the fit from the view options when opted in', async () => {
				renderGrid( {}, optedIn );
				const control = await queryControl();
				const user = userEvent.setup();
				await user.click( control as HTMLElement );
				expect( getGrid() ).toHaveClass( 'has-media-fit-contain' );
			} );
		} );
	} );

	describe( 'in list view', () => {
		it( 'should display the passed in data', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'list',
					} }
				/>
			);
			for ( const item of data ) {
				expect(
					( await screen.findAllByText( item.title ) )[ 0 ]
				).toBeInTheDocument();
			}
		} );

		it( 'should render actions dropdown if actions are supported and passed in for each list item', async () => {
			render(
				<DataViewWrapper
					view={ {
						type: 'list',
					} }
					actions={ actions }
				/>
			);
			expect(
				(
					await screen.findAllByRole( 'button', {
						name: 'Actions',
					} )
				).length
			).toEqual( 3 );
		} );

		describe.each( [
			[ 'ungrouped', undefined ],
			[ 'grouped', { field: 'author', direction: 'asc' as const } ],
		] )( 'when %s', ( _name, groupBy ) => {
			const view: View = {
				type: 'list',
				groupBy,
				layout: { density: 'compact' },
			};

			it( 'should apply the configured density', async () => {
				const { container } = render(
					<DataViewWrapper view={ view } />
				);
				await waitFor( () =>
					expect(
						// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
						container.querySelector( '.dataviews-view-list' )
					).toHaveClass( 'has-compact-density' )
				);
			} );

			it( 'should become inert while loading and refreshing once the delay elapses', async () => {
				const { container, rerender } = render(
					<DataViewWrapper view={ view } />
				);
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				const list = container.querySelector( '.dataviews-view-list' );

				expect( screen.getByRole( 'grid' ) ).not.toHaveAttribute(
					'inert'
				);

				rerender( <DataViewWrapper view={ view } isLoading /> );

				expect( screen.getByRole( 'grid' ) ).toHaveAttribute( 'inert' );
				// The refreshing state is deliberately delayed, so it is not
				// applied on the render that starts the load.
				expect( list ).not.toHaveClass( 'is-refreshing' );
				await waitFor( () =>
					expect( list ).toHaveClass( 'is-refreshing' )
				);
			} );
		} );
	} );

	describe( 'actions on mobile viewport', () => {
		const testActions: Action< Data >[] = [
			{
				id: 'edit',
				label: 'Edit',
				isPrimary: true,
				callback: () => {},
			},
		];

		beforeEach( () => {
			// Simulate mobile viewport
			mockUseViewportMatch.mockImplementation(
				( viewport: string, operator: string ) =>
					viewport === 'medium' && operator === '<'
			);
		} );

		afterEach( () => {
			mockUseViewportMatch.mockImplementation( () => false );
		} );

		it( 'should show actions dropdown on mobile even when there is only one action in table layout', () => {
			render(
				<DataViewWrapper
					view={ {
						type: LAYOUT_TABLE,
					} }
					actions={ testActions }
				/>
			);
			// On mobile, the dropdown should be visible even with only primary actions
			expect(
				screen.getAllByRole( 'button', { name: 'Actions' } ).length
			).toEqual( 3 );
		} );

		it( 'should show actions dropdown on mobile even when there is only one action in activity layout', () => {
			render(
				<DataViewWrapper
					view={ {
						type: LAYOUT_ACTIVITY,
					} }
					actions={ testActions }
				/>
			);
			// On mobile, the dropdown should be visible even with only primary actions
			expect(
				screen.getAllByRole( 'button', { name: 'Actions' } ).length
			).toEqual( 3 );
		} );
	} );
	describe( 'Default layouts', () => {
		/**
		 * A minimal wrapper that intentionally omits the `defaultLayouts` prop so
		 * DataViews falls back to its internal DEFAULT_LAYOUTS constant
		 * ({ table: true, grid: true, list: true }).
		 */
		function DataViewWrapperWithoutDefaultLayouts() {
			const [ view, setView ] = useState< View >( {
				...DEFAULT_VIEW,
				fields: [ 'title', 'order', 'author' ],
			} );

			const { data: shownData, paginationInfo } = useMemo( () => {
				return filterSortAndPaginate( data, view, fields );
			}, [ view ] );

			return (
				<DataViews
					getItemId={ ( item: Data ) => item.id.toString() }
					paginationInfo={ paginationInfo }
					data={ shownData }
					view={ view }
					fields={ fields }
					onChangeView={ setView }
					// No `defaultLayouts` prop — falls back to DEFAULT_LAYOUTS
				/>
			);
		}

		it( 'renders Table, Grid, and List layout options when defaultLayouts is not provided', async () => {
			render( <DataViewWrapperWithoutDefaultLayouts /> );

			const user = userEvent.setup();

			// All three default layouts are available, so the Layout switcher
			// button (rendered by ViewTypeMenu) must be present.
			const layoutButton = screen.getByRole( 'button', {
				name: 'Layout',
			} );
			expect( layoutButton ).toBeInTheDocument();

			// Open the layout menu.
			await user.click( layoutButton );

			// Table, Grid, and List options must all appear.
			expect(
				await screen.findByRole( 'menuitemradio', { name: 'Table' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Grid' } )
			).toBeInTheDocument();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'List' } )
			).toBeInTheDocument();

			// Table is the default active layout.
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Table' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Grid' } )
			).not.toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'List' } )
			).not.toBeChecked();
		} );
	} );
} );
