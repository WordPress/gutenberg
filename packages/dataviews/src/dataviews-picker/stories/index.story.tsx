/**
 * External dependencies
 */
import type { Meta } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useCallback, useEffect } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsPicker from '../index';
import { LAYOUT_PICKER_GRID, LAYOUT_PICKER_TABLE } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { ActionButton, View } from '../../types';
import { data, fields, type SpaceObject } from './fixtures';

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
			<Stack direction="row" justify="left" gap="xs">
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
			</Stack>
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
		infiniteScrollHandler?: ( () => void ) | undefined;
	};
	isLoadingMore: boolean;
	hasMoreData: boolean;
} {
	// Custom pagination handler that simulates server-side pagination
	const [ allLoadedRecords, setAllLoadedRecords ] = useState< SpaceObject[] >(
		[]
	);
	const [ isLoadingMore, setIsLoadingMore ] = useState( false );

	const totalItems = totalDataLength;
	const totalPages = Math.ceil( totalItems / ( view.perPage || 10 ) );
	const currentPage = view.page || 1;
	const hasMoreData = currentPage < totalPages;

	const infiniteScrollHandler = useCallback( () => {
		if ( isLoadingMore || currentPage >= totalPages ) {
			return;
		}

		setIsLoadingMore( true );

		setView( {
			...view,
			page: currentPage + 1,
		} );
	}, [ isLoadingMore, currentPage, totalPages, view, setView ] );

	// Initialize data on first load or when view changes significantly
	useEffect( () => {
		if ( currentPage === 1 || ! view.infiniteScrollEnabled ) {
			// First page - replace all data
			setAllLoadedRecords( shownData );
		} else {
			// Subsequent pages - append to existing data
			setAllLoadedRecords( ( prev ) => {
				const existingIds = new Set( prev.map( getItemId ) );
				const newRecords = shownData.filter(
					( record ) => ! existingIds.has( getItemId( record ) )
				);
				return [ ...prev, ...newRecords ];
			} );
		}
		setIsLoadingMore( false );
	}, [
		view.search,
		view.filters,
		view.perPage,
		currentPage,
		view.infiniteScrollEnabled,
	] );

	const paginationInfo = {
		totalItems,
		totalPages,
		infiniteScrollHandler,
	};

	return {
		data: allLoadedRecords,
		paginationInfo,
		isLoadingMore,
		hasMoreData,
	};
}
