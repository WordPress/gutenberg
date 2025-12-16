/**
 * External dependencies
 */
import type { Meta } from '@storybook/react';

/**
 * WordPress dependencies
 */
import {
	useState,
	useMemo,
	useCallback,
	useEffect,
	useRef,
} from '@wordpress/element';
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import DataViewsPicker from '../components/dataviews-picker/index';
import { LAYOUT_PICKER_GRID, LAYOUT_PICKER_TABLE } from '../constants';
import filterSortAndPaginate from '../utils/filter-sort-and-paginate';
import type { ActionButton, View } from '../types';
import { data, fields, type SpaceObject } from './dataviews.fixtures';

const meta = {
	title: 'DataViews/DataViewsPicker',
	component: DataViewsPicker,
} as Meta< typeof DataViewsPicker >;

export default meta;

const storyArgs = {
	perPageSizes: [ 10, 25, 50, 100 ],
	isMultiselectable: false,
	isGrouped: false,
	infiniteScrollEnabled: false,
};

const storyArgTypes = {
	isMultiselectable: {
		control: 'boolean',
		description: 'Whether multiselection is supported',
	},
	perPageSizes: {
		control: 'object',
		description: 'Array of available page sizes',
	},
	isGrouped: {
		control: 'boolean',
		description: 'Whether the items are grouped or ungrouped',
	},
	infiniteScrollEnabled: {
		control: 'boolean',
		description:
			'Whether the infinite scroll is enabled. Enabling this disables the "Is grouped" option',
	},
};

interface PickerContentProps {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
	actions?: ActionButton< SpaceObject >[];
	selection?: string[];
}

const DataViewsPickerContent = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
	actions: customActions,
	selection: customSelection,
}: PickerContentProps ) => {
	const [ view, setView ] = useState< View >( {
		fields: [],
		titleField: 'title',
		mediaField: 'image',
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
		type: LAYOUT_PICKER_GRID,
		groupBy: isGrouped ? { field: 'type', direction: 'asc' } : undefined,
		infiniteScrollEnabled,
	} );
	const { data: shownData, paginationInfo: normalPaginationInfo } =
		useMemo( () => {
			return filterSortAndPaginate( data, view, fields );
		}, [ view ] );

	useEffect( () => {
		setView( ( prevView ) => ( {
			...prevView,
			groupBy:
				isGrouped && ! infiniteScrollEnabled
					? { field: 'type', direction: 'asc' }
					: undefined,
			infiniteScrollEnabled,
		} ) );
	}, [ isGrouped, infiniteScrollEnabled ] );

	const [ selection, setSelection ] = useState< string[] >(
		customSelection || []
	);

	const actions: ActionButton< SpaceObject >[] = customActions || [
		{
			id: 'cancel',
			label: 'Cancel',
			supportsBulk: isMultiselectable,
			callback() {
				setSelection( [] );
			},
		},
		{
			id: 'confirm',
			label: 'Confirm',
			isPrimary: true,
			supportsBulk: isMultiselectable,
			callback() {
				const selectedItemNames = data
					.filter(
						( item ) => selection?.includes( String( item.id ) )
					)
					.map( ( item ) => item.name.title )
					.join( ', ' );
				// eslint-disable-next-line no-alert
				window.alert( selectedItemNames );
			},
		},
	];

	const {
		data: infiniteScrollData,
		paginationInfo: infiniteScrollPaginationInfo,
		isLoadingMore,
	} = useInfiniteScroll( {
		view,
		setView,
		data: shownData,
		getItemId: ( item ) => item.id.toString(),
		totalDataLength: data.length,
	} );

	return (
		<>
			{ infiniteScrollEnabled && (
				<style>{ `
					.dataviews-picker-wrapper {
						height: 600px;
						overflow: auto;
					}
				` }</style>
			) }
			<DataViewsPicker
				actions={ actions }
				selection={ selection }
				onChangeSelection={ ( selectedIds ) => {
					setSelection( selectedIds );
				} }
				getItemId={ ( item ) => item.id.toString() }
				paginationInfo={
					infiniteScrollEnabled
						? infiniteScrollPaginationInfo
						: normalPaginationInfo
				}
				data={ infiniteScrollEnabled ? infiniteScrollData : shownData }
				isLoading={ infiniteScrollEnabled ? isLoadingMore : undefined }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				config={ { perPageSizes } }
				itemListLabel="Galactic Bodies"
				defaultLayouts={ {
					[ LAYOUT_PICKER_GRID ]: {},
					[ LAYOUT_PICKER_TABLE ]: { perPage: 20 },
				} }
			/>
		</>
	);
};

export const Default = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
}: {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
} ) => (
	<DataViewsPickerContent
		perPageSizes={ perPageSizes }
		isMultiselectable={ isMultiselectable }
		isGrouped={ isGrouped }
		infiniteScrollEnabled={ infiniteScrollEnabled }
	/>
);

Default.args = storyArgs;
Default.argTypes = storyArgTypes;

export const WithModal = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
}: {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
} ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ selectedItems, setSelectedItems ] = useState< SpaceObject[] >( [] );

	const modalActions: ActionButton< SpaceObject >[] = [
		{
			id: 'cancel',
			label: 'Cancel',
			supportsBulk: isMultiselectable,
			callback() {
				setIsModalOpen( false );
			},
		},
		{
			id: 'confirm',
			label: 'Confirm',
			isPrimary: true,
			supportsBulk: isMultiselectable,
			callback( items ) {
				setSelectedItems( items );
				setIsModalOpen( false );
			},
		},
	];

	return (
		<>
			<HStack justify="left">
				<Button
					variant="primary"
					onClick={ () => setIsModalOpen( true ) }
				>
					Open Picker Modal
				</Button>
				<Button
					onClick={ () => setSelectedItems( [] ) }
					disabled={ ! selectedItems.length }
					accessibleWhenDisabled
				>
					Clear Selection
				</Button>
			</HStack>
			{ selectedItems.length > 0 && (
				<p>
					Selected:{ ' ' }
					{ selectedItems
						.map( ( item ) => item.name.title )
						.join( ', ' ) }
				</p>
			) }
			{ isModalOpen && (
				<>
					<style>{ `
						.components-modal__content {
							padding: 0;
						}
						.components-modal__frame.is-full-screen .components-modal__content {
							margin-bottom: 0;
						}
					` }</style>
					<Modal
						title="Select Items"
						onRequestClose={ () => setIsModalOpen( false ) }
						isFullScreen={ false }
						size="fill"
					>
						<DataViewsPickerContent
							perPageSizes={ perPageSizes }
							isMultiselectable={ isMultiselectable }
							isGrouped={ isGrouped }
							infiniteScrollEnabled={ infiniteScrollEnabled }
							actions={ modalActions }
							selection={ selectedItems.map( ( item ) =>
								String( item.id )
							) }
						/>
					</Modal>
				</>
			) }
		</>
	);
};

WithModal.args = storyArgs;
WithModal.argTypes = storyArgTypes;

function useInfiniteScroll( {
	view,
	setView,
	data: shownData,
	getItemId,
	totalDataLength,
}: {
	view: View;
	setView: ( view: View ) => void;
	data: SpaceObject[];
	getItemId: ( item: SpaceObject ) => string;
	totalDataLength: number;
} ): {
	data: SpaceObject[];
	paginationInfo: {
		totalItems: number;
		totalPages: number;
		infiniteScrollHandler?: ( direction: 'up' | 'down' ) => void;
		setVisibleEntries?: React.Dispatch< React.SetStateAction< number[] > >;
	};
	isLoadingMore: boolean;
	hasMoreData: boolean;
} {
	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState<
		( SpaceObject | null )[]
	>( [] );
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );
	const [ scrollDirection, setScrollDirection ] = useState<
		'up' | 'down' | undefined
	>( undefined );

	const [ visibleEntries, setVisibleEntries ] = useState< number[] >( [] );

	// Track the mapping of item IDs to their positions in the full dataset
	const positionMapRef = useRef< Map< string, number > >( new Map() );

	// Track the range of data we've loaded to maintain placeholders
	const loadedRangeRef = useRef< { min: number; max: number } | null >(
		null
	);

	const totalItems = totalDataLength;
	const totalPages = Math.ceil( totalItems / ( view.perPage || 10 ) );
	const currentPage = view.page || 1;
	const hasMoreData = currentPage < totalPages;

	const infiniteScrollHandler = useCallback(
		( direction: 'up' | 'down' ) => {
			if ( isLoadingMore ) {
				return;
			}

			// Handle scrolling down to load next page
			if ( direction === 'down' && currentPage < totalPages ) {
				setIsLoadingMore( true );
				setScrollDirection( 'down' );
				setView( {
					...view,
					page: currentPage + 1,
				} );
			}

			// Handle scrolling up to load previous page
			if ( direction === 'up' && currentPage > 1 ) {
				setIsLoadingMore( true );
				setScrollDirection( 'up' );
				setView( {
					...view,
					page: currentPage - 1,
				} );
			}
		},
		[ isLoadingMore, currentPage, totalPages, view, setView ]
	);

	// Initialize data on first load or when view changes significantly
	useEffect( () => {
		if (
			( currentPage === 1 && ! allLoadedRecords.length ) ||
			! view.infiniteScrollEnabled
		) {
			// First page - replace all data and initialize range
			const startPosition = 1;
			const records = shownData.map( ( record, index ) => {
				const position = view.infiniteScrollEnabled
					? startPosition + index
					: undefined;
				if ( position !== undefined ) {
					positionMapRef.current.set( getItemId( record ), position );
				}
				return {
					...record,
					position,
				};
			} );
			setAllLoadedRecords( records );

			if ( records.length > 0 ) {
				loadedRangeRef.current = {
					min: Math.min( ...records.map( ( r ) => r.id ) ),
					max: Math.max( ...records.map( ( r ) => r.id ) ),
				};
			}
		} else {
			// Subsequent pages - load more data with placeholders
			setAllLoadedRecords( ( prev ) => {
				const existingIds = new Set(
					prev
						.filter(
							( item ): item is SpaceObject => item !== null
						)
						.map( getItemId )
				);
				// Calculate start position based on the highest position already tracked
				let nextPosition =
					positionMapRef.current.size > 0
						? Math.max( ...positionMapRef.current.values() ) + 1
						: 1;

				const newRecords = shownData
					.filter(
						( record ) => ! existingIds.has( getItemId( record ) )
					)
					.map( ( record ) => {
						const itemId = getItemId( record );
						let position: number | undefined;

						if ( view.infiniteScrollEnabled ) {
							// Check if this record already has a position
							const existingPosition =
								positionMapRef.current.get( itemId );
							if ( existingPosition !== undefined ) {
								position = existingPosition;
							} else {
								// Assign new position and increment for next record
								position = nextPosition;
								positionMapRef.current.set( itemId, position );
								nextPosition++;
							}
						}

						return {
							...record,
							position,
						};
					} );

				if ( newRecords.length === 0 ) {
					return prev;
				}

				// Update the loaded range
				const allRecords =
					scrollDirection === 'up'
						? [ ...newRecords, ...prev ]
						: [ ...prev, ...newRecords ];

				const allIds = allRecords
					.filter( ( r ): r is SpaceObject => r !== null )
					.map( ( r ) => r.id );
				const newMin = Math.min( ...allIds );
				const newMax = Math.max( ...allIds );

				loadedRangeRef.current = {
					min: newMin,
					max: newMax,
				};

				// Create array with placeholders to maintain positions
				const result: ( SpaceObject | null )[] = [];
				for ( let id = newMin; id <= newMax; id++ ) {
					const record = allRecords.find(
						( r ) => r !== null && r.id === id
					);
					result.push( record || null );
				}

				// Filter to keep only records that should remain visible
				// Keep items within a certain range of visible entries
				if ( visibleEntries.length > 0 ) {
					const visibleMin = Math.min( ...visibleEntries );
					const visibleMax = Math.max( ...visibleEntries );
					const buffer = 6;

					const filtered = result
						.map( ( record, index ) => {
							const itemId = newMin + index;
							// Keep records that are null (placeholders) or within the visible range
							if ( record === null ) {
								return record;
							}
							// Keep items within buffer range of visible items
							if (
								itemId >= visibleMin - buffer &&
								itemId <= visibleMax + buffer
							) {
								return record;
							}
							// Replace with placeholder if outside buffer
							return null;
						} )
						.filter(
							( record, index ) =>
								record !== null ||
								( newMin + index >= visibleMin - buffer &&
									newMin + index <= visibleMax + buffer )
						);

					return filtered;
				}

				return result.filter( ( r ) => r !== null );
			} );
		}
		setIsLoadingMore( false );
	}, [
		shownData,
		view.search,
		view.filters,
		view.perPage,
		currentPage,
		view.infiniteScrollEnabled,
		allLoadedRecords.length,
		scrollDirection,
		visibleEntries,
		getItemId,
	] );

	const paginationInfo = {
		totalItems,
		totalPages,
		infiniteScrollHandler,
		setVisibleEntries,
	};

	// Filter out null placeholders for display
	const displayData = allLoadedRecords.filter(
		( record ): record is SpaceObject => record !== null
	);

	return {
		data: displayData,
		paginationInfo,
		isLoadingMore,
		hasMoreData,
	};
}
