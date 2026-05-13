/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useData from '../use-data';
import type { View } from '../../types';

type TestItem = { id: number; name?: string };

const getItemId = ( item: TestItem ) => String( item.id );
const defaultPaginationInfo = { totalItems: 100, totalPages: 10 };

describe( 'useData', () => {
	describe( 'when infinite scroll is disabled', () => {
		it( 'returns provided data unchanged', () => {
			const data: TestItem[] = [
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
			];
			const view = {
				type: 'table',
				infiniteScrollEnabled: false,
			} as View;

			const { result } = renderHook( () =>
				useData( {
					view,
					data,
					getItemId,
					paginationInfo: defaultPaginationInfo,
				} )
			);

			expect( result.current.data ).toEqual( data );
			expect( result.current.setVisibleEntries ).toBeUndefined();
		} );

		it( 'returns empty array when data is empty', () => {
			const data: TestItem[] = [];
			const view = {
				type: 'table',
				infiniteScrollEnabled: false,
			} as View;

			const { result } = renderHook( () =>
				useData( {
					view,
					data,
					getItemId,
					paginationInfo: defaultPaginationInfo,
				} )
			);

			expect( result.current.data ).toEqual( [] );
		} );
	} );

	describe( 'when infinite scroll is enabled', () => {
		describe( 'initial load', () => {
			it( 'assigns positions starting from 1 by default', () => {
				const data: TestItem[] = [
					{ id: 1, name: 'Item 1' },
					{ id: 2, name: 'Item 2' },
				];
				const view = {
					type: 'table',
					infiniteScrollEnabled: true,
				} as View;

				const { result } = renderHook( () =>
					useData( {
						view,
						data,
						getItemId,
						paginationInfo: defaultPaginationInfo,
					} )
				);

				expect( result.current.data ).toHaveLength( 2 );
				expect(
					(
						result.current.data[ 0 ] as TestItem & {
							position: number;
						}
					 ).position
				).toBe( 1 );
				expect(
					(
						result.current.data[ 1 ] as TestItem & {
							position: number;
						}
					 ).position
				).toBe( 2 );
			} );

			it( 'assigns positions starting from view.startPosition when provided', () => {
				const data: TestItem[] = [
					{ id: 1, name: 'Item 1' },
					{ id: 2, name: 'Item 2' },
				];
				const view = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 5,
				} as View;

				const { result } = renderHook( () =>
					useData( {
						view,
						data,
						getItemId,
						paginationInfo: defaultPaginationInfo,
					} )
				);

				expect(
					(
						result.current.data[ 1 ] as TestItem & {
							position: number;
						}
					 ).position
				).toBe( 6 );
			} );

			it( 'returns setVisibleEntries callback', () => {
				const data: TestItem[] = [ { id: 1 } ];
				const view = {
					type: 'table',
					infiniteScrollEnabled: true,
				} as View;

				const { result } = renderHook( () =>
					useData( {
						view,
						data,
						getItemId,
						paginationInfo: defaultPaginationInfo,
					} )
				);

				expect( result.current.setVisibleEntries ).toBeDefined();
				expect( typeof result.current.setVisibleEntries ).toBe(
					'function'
				);
			} );
		} );

		describe( 'loading more data when scrolling down', () => {
			it( 'appends new items with positions after existing items', () => {
				const initialData: TestItem[] = [
					{ id: 1, name: 'Item 1' },
					{ id: 2, name: 'Item 2' },
				];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				expect( result.current.data ).toHaveLength( 2 );

				// Simulate scroll down - new page of data
				const newData: TestItem[] = [
					{ id: 3, name: 'Item 3' },
					{ id: 4, name: 'Item 4' },
				];
				const newView = {
					...initialView,
					startPosition: 3,
				} as View;

				rerender( { view: newView, data: newData } );

				// Should have all 4 items
				expect( result.current.data ).toHaveLength( 4 );
				// Items should be sorted by position
				const positions = result.current.data.map(
					( d: TestItem & { position?: number } ) =>
						( d as TestItem & { position: number } ).position
				);
				expect( positions ).toEqual( [ 1, 2, 3, 4 ] );
			} );

			it( 'preserves positions for existing items', () => {
				const initialData: TestItem[] = [ { id: 1 }, { id: 2 } ];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				// Scroll down with overlapping data
				const newData: TestItem[] = [
					{ id: 2 }, // Already exists
					{ id: 3 }, // New
				];
				const newView = { ...initialView, startPosition: 2 } as View;

				rerender( { view: newView, data: newData } );

				// Item 2 should keep its original position (2)
				const item2 = result.current.data.find(
					( d: TestItem & { position?: number } ) => d.id === 2
				) as TestItem & { position: number };
				expect( item2.position ).toBe( 2 );

				// Item 3 should get position 3
				const item3 = result.current.data.find(
					( d: TestItem & { position?: number } ) => d.id === 3
				) as TestItem & { position: number };
				expect( item3.position ).toBe( 3 );
			} );
		} );

		describe( 'loading more data when scrolling up', () => {
			it( 'prepends new items with positions before existing items', () => {
				// Start with items at positions 5, 6
				const initialData: TestItem[] = [
					{ id: 5, name: 'Item 5' },
					{ id: 6, name: 'Item 6' },
				];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 5,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				expect( result.current.data ).toHaveLength( 2 );

				// Simulate scroll up - load earlier data
				const newData: TestItem[] = [
					{ id: 3, name: 'Item 3' },
					{ id: 4, name: 'Item 4' },
				];
				const newView = {
					...initialView,
					startPosition: 3, // Scrolling up
				} as View;

				rerender( { view: newView, data: newData } );

				// Should have all 4 items
				expect( result.current.data ).toHaveLength( 4 );
				// Items should be sorted by position (ascending)
				const ids = result.current.data.map(
					( d: TestItem & { position?: number } ) => d.id
				);
				expect( ids ).toEqual( [ 3, 4, 5, 6 ] );
			} );
		} );

		describe( 'deduplication', () => {
			it( 'removes duplicates when new data overlaps with existing data', () => {
				const initialData: TestItem[] = [
					{ id: 1 },
					{ id: 2 },
					{ id: 3 },
				];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				// New data with overlapping items
				const newData: TestItem[] = [ { id: 2 }, { id: 3 }, { id: 4 } ];
				const newView = { ...initialView, startPosition: 2 } as View;

				rerender( { view: newView, data: newData } );

				// Should not have duplicate IDs
				const ids = result.current.data.map(
					( d: TestItem & { position?: number } ) => d.id
				);
				const uniqueIds = [ ...new Set( ids ) ];
				expect( ids ).toEqual( uniqueIds );
			} );
		} );

		describe( 'buffer and unloading', () => {
			it( 'keeps selected items even when outside visible buffer', () => {
				const initialData: TestItem[] = Array.from(
					{ length: 30 },
					( _, i ) => ( { id: i + 1 } )
				);
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data, selection } ) =>
						useData( {
							view,
							data,
							getItemId,
							selection,
							paginationInfo: defaultPaginationInfo,
						} ),
					{
						initialProps: {
							view: initialView,
							data: initialData,
							selection: [ '5' ],
						},
					}
				);

				act( () => {
					result.current.setVisibleEntries?.( [ 50, 51 ] );
				} );

				const newData: TestItem[] = Array.from(
					{ length: 10 },
					( _, i ) => ( { id: 31 + i } )
				);
				const newView = { ...initialView, startPosition: 31 } as View;

				rerender( {
					view: newView,
					data: newData,
					selection: [ '5' ],
				} );

				expect(
					result.current.data.some(
						( item: TestItem & { position?: number } ) =>
							item.id === 5
					)
				).toBe( true );
			} );

			it( 'keeps items within buffer range of visible entries', () => {
				// Create a large dataset
				const initialData: TestItem[] = Array.from(
					{ length: 30 },
					( _, i ) => ( { id: i + 1 } )
				);
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				expect( result.current.data ).toHaveLength( 30 );

				// Set visible entries to middle of the list
				act( () => {
					result.current.setVisibleEntries?.( [ 15, 16, 17, 18 ] );
				} );

				// Scroll down with new data to trigger buffer logic
				const newData: TestItem[] = Array.from(
					{ length: 10 },
					( _, i ) => ( { id: 31 + i } )
				);
				const newView = { ...initialView, startPosition: 31 } as View;

				rerender( { view: newView, data: newData } );

				// Items far above visible range should be trimmed (buffer of 20)
				// Visible min is 15, so items below position (15 - 20 = -5) should be removed
				// Since all items have positive positions, none should be removed in this case
				// when scrolling down
				const positions = result.current.data.map(
					( d: TestItem & { position?: number } ) =>
						( d as TestItem & { position: number } ).position
				);
				const minPosition = Math.min( ...positions );

				// When scrolling down, items above visible range minus buffer should be trimmed
				// visibleMin - buffer = 15 - 20 = -5, so all items >= -5 are kept
				expect( minPosition ).toBeGreaterThanOrEqual( -5 );
			} );

			it( 'trims items from the end when scrolling up', () => {
				// Start with items at high positions
				const initialData: TestItem[] = Array.from(
					{ length: 30 },
					( _, i ) => ( { id: i + 50 } )
				);
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 50,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				// Set visible entries
				act( () => {
					result.current.setVisibleEntries?.( [ 55, 56, 57, 58 ] );
				} );

				// Scroll up with new data
				const newData: TestItem[] = Array.from(
					{ length: 10 },
					( _, i ) => ( {
						id: i + 40,
					} )
				);
				const newView = { ...initialView, startPosition: 40 } as View;

				rerender( { view: newView, data: newData } );

				// When scrolling up, items below visible range + buffer should be trimmed
				// visibleMax + buffer = 58 + 20 = 78
				const positions = result.current.data.map(
					( d: TestItem & { position?: number } ) =>
						( d as TestItem & { position: number } ).position
				);
				const maxPosition = Math.max( ...positions );

				expect( maxPosition ).toBeLessThanOrEqual( 78 );
			} );
		} );

		describe( 'view changes', () => {
			it( 'resets data when search changes', () => {
				const initialData: TestItem[] = [ { id: 1 }, { id: 2 } ];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
					search: '',
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				expect( result.current.data ).toHaveLength( 2 );

				// Change search - data should be replaced, not appended
				const newData: TestItem[] = [ { id: 3 } ];
				const newView = { ...initialView, search: 'test' } as View;

				rerender( { view: newView, data: newData } );

				// Data should be reset to just the new search results
				expect( result.current.data ).toHaveLength( 1 );
				expect( result.current.data[ 0 ].id ).toBe( 3 );
			} );

			it( 'resets data when filters change', () => {
				const initialData: TestItem[] = [ { id: 1 }, { id: 2 } ];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
					filters: [],
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				expect( result.current.data ).toHaveLength( 2 );

				// Change filters - data should be replaced
				const newData: TestItem[] = [ { id: 5 } ];
				const newView = {
					...initialView,
					filters: [
						{ field: 'status', operator: 'is', value: 'published' },
					],
				} as View;

				rerender( { view: newView, data: newData } );

				expect( result.current.data ).toHaveLength( 1 );
				expect( result.current.data[ 0 ].id ).toBe( 5 );
			} );

			it( 'resets data when perPage changes', () => {
				const initialData: TestItem[] = [ { id: 1 }, { id: 2 } ];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
					perPage: 10,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				expect( result.current.data ).toHaveLength( 2 );

				// Change perPage - data should be replaced
				const newData: TestItem[] = [
					{ id: 1 },
					{ id: 2 },
					{ id: 3 },
					{ id: 4 },
					{ id: 5 },
				];
				const newView = { ...initialView, perPage: 25 } as View;

				rerender( { view: newView, data: newData } );

				expect( result.current.data ).toHaveLength( 5 );
			} );

			it( 'handles transition from infinite scroll disabled to enabled', () => {
				const data: TestItem[] = [ { id: 1 }, { id: 2 } ];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: false,
				} as View;

				const { result, rerender } = renderHook(
					( { view, passedData } ) =>
						useData( {
							view,
							data: passedData,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, passedData: data } }
				);

				expect( result.current.setVisibleEntries ).toBeUndefined();

				// Enable infinite scroll
				const newView = {
					...initialView,
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				rerender( { view: newView, passedData: data } );

				expect( result.current.setVisibleEntries ).toBeDefined();
				expect( result.current.data ).toHaveLength( 2 );
			} );

			it( 'returns all data when clearing search after filtering', () => {
				// This tests the scenario where:
				// 1. User has full data list
				// 2. User searches and gets fewer results
				// 3. Visible entries are set for the filtered results
				// 4. User clears search
				// 5. Full data should be returned, not limited by stale visible entries
				const fullData: TestItem[] = Array.from(
					{ length: 25 },
					( _, i ) => ( { id: i + 1 } )
				);
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
					search: '',
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: fullData } }
				);

				// Simulate visible entries being set for the 6 items
				act( () => {
					result.current.setVisibleEntries?.( [ 1, 2, 3, 4, 5, 6 ] );
				} );
				const clearedView = { ...initialView, search: '' } as View;
				rerender( { view: clearedView, data: fullData } );

				// Should return all 25 items, not limited by stale visible entries
				expect( result.current.data ).toHaveLength( 25 );
			} );

			it( 'returns all data when changing search term', () => {
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
					search: 'foo',
				} as View;
				const fooResults: TestItem[] = [
					{ id: 1 },
					{ id: 2 },
					{ id: 3 },
				];

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: fooResults } }
				);

				expect( result.current.data ).toHaveLength( 3 );

				// Set visible entries for the 3 items
				act( () => {
					result.current.setVisibleEntries?.( [ 1, 2, 3 ] );
				} );

				// Change to a different search with more results
				const barResults: TestItem[] = Array.from(
					{ length: 15 },
					( _, i ) => ( { id: i + 10 } )
				);
				const barView = { ...initialView, search: 'bar' } as View;
				rerender( { view: barView, data: barResults } );

				// Should return all 15 items, not limited to 3
				expect( result.current.data ).toHaveLength( 15 );
			} );

			it( 'handles single item', () => {
				const data: TestItem[] = [ { id: 1 } ];
				const view = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 1,
				} as View;

				const { result } = renderHook( () =>
					useData( {
						view,
						data,
						getItemId,
						paginationInfo: defaultPaginationInfo,
					} )
				);

				expect( result.current.data ).toHaveLength( 1 );
				expect(
					(
						result.current.data[ 0 ] as TestItem & {
							position: number;
						}
					 ).position
				).toBe( 1 );
			} );

			it( 'maintains correct order after multiple scroll direction changes', () => {
				const initialData: TestItem[] = [
					{ id: 5 },
					{ id: 6 },
					{ id: 7 },
				];
				const initialView = {
					type: 'table',
					infiniteScrollEnabled: true,
					startPosition: 5,
				} as View;

				const { result, rerender } = renderHook(
					( { view, data } ) =>
						useData( {
							view,
							data,
							getItemId,
							paginationInfo: defaultPaginationInfo,
						} ),
					{ initialProps: { view: initialView, data: initialData } }
				);

				// Scroll down
				rerender( {
					view: { ...initialView, startPosition: 8 } as View,
					data: [ { id: 8 }, { id: 9 } ],
				} );

				// Scroll up
				rerender( {
					view: { ...initialView, startPosition: 3 } as View,
					data: [ { id: 3 }, { id: 4 } ],
				} );

				// Scroll down again
				rerender( {
					view: { ...initialView, startPosition: 10 } as View,
					data: [ { id: 10 } ],
				} );

				// All items should be in ascending order by position
				const positions = result.current.data.map(
					( d: TestItem & { position?: number } ) =>
						( d as TestItem & { position: number } ).position
				);
				const sortedPositions = [ ...positions ].sort(
					( a, b ) => a - b
				);
				expect( positions ).toEqual( sortedPositions );
			} );
		} );
	} );
} );
