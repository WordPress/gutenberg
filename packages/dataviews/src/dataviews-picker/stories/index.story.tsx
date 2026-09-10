import type { Meta } from '@storybook/react-vite';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { Modal, Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import DataViewsPicker from '../index';
import { LAYOUT_PICKER_GRID } from '../../constants';
import filterSortAndPaginate from '../../utils/filter-sort-and-paginate';
import type { ActionButton, MediaFit, View } from '../../types';
import { data, fields, type SpaceObject } from './fixtures';

const meta = {
	tags: [ 'manifest' ],
	title: 'DataViews/DataViewsPicker',
	component: DataViewsPicker,
} as Meta< typeof DataViewsPicker >;

export default meta;

const storyArgs = {
	perPageSizes: [ 10, 25, 50, 100 ],
	isMultiselectable: false,
	isGrouped: false,
	infiniteScrollEnabled: false,
	mediaFit: 'cover',
	mediaFitControl: true,
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
	mediaFit: {
		control: 'select',
		options: [ 'cover', 'contain' ],
		description:
			'How the media field fills the preview box: cropped to fill it ("cover") or fitted inside it ("contain"), letterboxing the media so its own aspect ratio stays visible',
	},
	mediaFitControl: {
		control: 'boolean',
		description:
			'Whether the view options offer the "Original aspect ratio" toggle, letting users switch the media fit themselves',
	},
};

interface PickerContentProps {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
	mediaFit?: MediaFit;
	mediaFitControl?: boolean;
	actions?: ActionButton< SpaceObject >[];
	selection?: string[];
}

const DataViewsPickerContent = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
	mediaFit = 'cover',
	mediaFitControl = true,
	actions: customActions,
	selection: customSelection,
}: PickerContentProps ) => {
	const [ view, setView ] = useState< View >( () => {
		const baseView: View = {
			fields: [],
			titleField: 'title',
			mediaField: 'image',
			search: '',
			filters: [],
			type: LAYOUT_PICKER_GRID,
			groupBy: isGrouped
				? { field: 'type', direction: 'asc' as const }
				: undefined,
			infiniteScrollEnabled,
			layout: { mediaFit },
		};

		if ( infiniteScrollEnabled ) {
			return {
				...baseView,
				startPosition: 1,
				perPage: 10,
			};
		}

		return {
			...baseView,
			page: 1,
			perPage: 10,
		};
	} );
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );

	useEffect( () => {
		setView( ( prevView ) => {
			const baseUpdates = {
				groupBy:
					isGrouped && ! infiniteScrollEnabled
						? { field: 'type', direction: 'asc' as const }
						: undefined,
				infiniteScrollEnabled,
				// Spread the previous layout so a change made through the
				// view options popover survives an unrelated arg change.
				layout: { ...prevView.layout, mediaFit },
			};

			if ( infiniteScrollEnabled ) {
				return {
					...prevView,
					...baseUpdates,
					startPosition: 1,
					perPage: 15,
					page: undefined,
				} as View;
			}

			return {
				...prevView,
				...baseUpdates,
				page: prevView.page ?? 1,
				perPage: prevView.perPage ?? 10,
				startPosition: undefined,
			} as View;
		} );
	}, [ isGrouped, infiniteScrollEnabled, mediaFit ] );

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

	return (
		<>
			{ infiniteScrollEnabled && (
				<style>{ `
					.dataviews-picker-wrapper {
						height: 750px;
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
				paginationInfo={ paginationInfo }
				data={ shownData }
				view={ view }
				fields={ fields }
				onChangeView={ setView }
				config={ { perPageSizes, mediaFitControl } }
				defaultLayouts={ {
					pickerGrid: true,
					pickerTable: true,
					pickerActivity: true,
				} }
				itemListLabel="Galactic Bodies"
			/>
		</>
	);
};

export const Default = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
	mediaFit,
	mediaFitControl,
}: {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
	mediaFit?: MediaFit;
	mediaFitControl?: boolean;
} ) => (
	<DataViewsPickerContent
		perPageSizes={ perPageSizes }
		isMultiselectable={ isMultiselectable }
		isGrouped={ isGrouped }
		infiniteScrollEnabled={ infiniteScrollEnabled }
		mediaFit={ mediaFit }
		mediaFitControl={ mediaFitControl }
	/>
);

Default.args = storyArgs;
Default.argTypes = storyArgTypes;
Default.parameters = {
	// FIXME: Picker UI nests interactive controls (nested-interactive).
	// See: https://github.com/WordPress/gutenberg/issues/81596
	a11y: { test: 'todo' },
};

export const WithModal = ( {
	perPageSizes = [ 10, 25, 50, 100 ],
	isMultiselectable,
	isGrouped,
	infiniteScrollEnabled,
	mediaFit,
	mediaFitControl,
}: {
	perPageSizes: number[];
	isMultiselectable: boolean;
	isGrouped: boolean;
	infiniteScrollEnabled: boolean;
	mediaFit?: MediaFit;
	mediaFitControl?: boolean;
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
			<Stack direction="row" justify="left" gap="sm">
				<Button
					variant="primary"
					__next40pxDefaultSize
					onClick={ () => setIsModalOpen( true ) }
				>
					Open Picker Modal
				</Button>
				<Button
					onClick={ () => setSelectedItems( [] ) }
					disabled={ ! selectedItems.length }
					accessibleWhenDisabled
					__next40pxDefaultSize
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
							mediaFit={ mediaFit }
							mediaFitControl={ mediaFitControl }
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
