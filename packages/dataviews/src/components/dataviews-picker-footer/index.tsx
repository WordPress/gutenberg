import type { ReactNode } from 'react';
import { Button, CheckboxControl } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useContext, useMemo, useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import DataViewsPagination, {
	hasPaginationControls,
} from '../dataviews-pagination';
import DataViewsContext from '../dataviews-context';
import type { SetSelection } from '../../types/private';
import type { Action } from '../../types';
import getFooterMessage from '../../utils/get-footer-message';

const EMPTY_ARRAY: [] = [];

export function useIsMultiselectPicker< Item >(
	actions: Action< Item >[] | undefined
) {
	return useMemo( () => {
		return (
			!! actions?.length &&
			actions?.every( ( action ) => action.supportsBulk )
		);
	}, [ actions ] );
}

function BulkSelectionCheckbox< Item >( {
	selection,
	selectedItems,
	onChangeSelection,
	data,
	getItemId,
	disableSelectAll = false,
}: {
	selection: string[];
	selectedItems: Item[];
	onChangeSelection: SetSelection;
	data: Item[];
	getItemId: ( item: Item ) => string;
	disableSelectAll?: boolean;
} ) {
	const hasSelection = selection.length > 0;
	const areAllSelected = selectedItems.length === data.length;

	if ( disableSelectAll ) {
		return (
			<CheckboxControl
				className="dataviews-view-table-selection-checkbox"
				checked={ hasSelection }
				disabled={ ! hasSelection }
				onChange={ () => {
					onChangeSelection( [] );
				} }
				aria-label={ __( 'Deselect all' ) }
			/>
		);
	}

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && !! selectedItems.length }
			onChange={ () => {
				if ( areAllSelected ) {
					// Deselect all - remove the current page from the total selection.
					onChangeSelection(
						selection.filter(
							( id ) =>
								! data.some(
									( item ) => id === getItemId( item )
								)
						)
					);
				} else {
					// Select all - merge the current page into the total selection.
					const selectionSet = new Set( [
						...selection,
						...data.map( ( item ) => getItemId( item ) ),
					] );
					onChangeSelection( Array.from( selectionSet ) );
				}
			} }
			aria-label={
				areAllSelected ? __( 'Deselect all' ) : __( 'Select all' )
			}
		/>
	);
}

function ActionButtons< Item >( {
	actions,
	items,
	selection,
}: {
	actions: Action< Item >[];
	items: Item[];
	selection: string[];
} ) {
	const registry = useRegistry();
	const [ actionInProgress, setActionInProgress ] = useState< string | null >(
		null
	);

	return (
		<Stack direction="row" gap="xs">
			{ actions.map( ( action ) => {
				// Only support actions with callbacks for DataViewsPicker.
				// This is because many use cases of the picker will be already within modals.
				if ( ! ( 'callback' in action ) ) {
					return null;
				}

				const { id, label, icon, isPrimary, isEligible, callback } =
					action;

				// The label reflects the selection; eligibility only
				// controls whether the action can run on it.
				const eligibleItems = isEligible
					? items.filter( ( item ) => isEligible( item ) )
					: items;
				const _label =
					typeof label === 'string' ? label : label( items );
				const variant = isPrimary ? 'primary' : 'tertiary';
				const isInProgress = id === actionInProgress;

				return (
					<Button
						key={ id }
						accessibleWhenDisabled
						icon={ icon }
						disabled={
							isInProgress ||
							! selection?.length ||
							! eligibleItems.length
						}
						isBusy={ isInProgress }
						onClick={ async () => {
							setActionInProgress( id );
							await callback( eligibleItems, {
								registry,
							} );
							setActionInProgress( null );
						} }
						size="compact"
						variant={ variant }
					>
						{ _label }
					</Button>
				);
			} ) }
		</Stack>
	);
}

function PickerBulkSelectionInfo() {
	const {
		data,
		selection,
		onChangeSelection,
		getItemId,
		actions = EMPTY_ARRAY,
		paginationInfo,
		view,
	} = useContext( DataViewsContext );

	const isMultiselect = useIsMultiselectPicker( actions );

	const selectedItems = useMemo(
		() =>
			data.filter( ( item ) => selection.includes( getItemId( item ) ) ),
		[ selection, getItemId, data ]
	);

	// The count and the selection checkbox belong with the actions, mirroring `DataViews`.
	if ( ! actions.length ) {
		return null;
	}

	const message = getFooterMessage(
		selection.length,
		data.length,
		paginationInfo.totalItems,
		!! view.infiniteScrollEnabled
	);

	return (
		<Stack
			direction="row"
			className="dataviews-picker-footer__bulk-selection"
			gap="md"
			align="center"
		>
			{ isMultiselect && (
				<BulkSelectionCheckbox
					selection={ selection }
					selectedItems={ selectedItems }
					onChangeSelection={ onChangeSelection }
					data={ data }
					getItemId={ getItemId }
					disableSelectAll={ !! view.infiniteScrollEnabled }
				/>
			) }
			<span className="dataviews-bulk-actions-footer__item-count">
				{ message }
			</span>
		</Stack>
	);
}

export function DataViewsPickerActions() {
	const {
		data,
		selection,
		getItemId,
		actions = EMPTY_ARRAY,
	} = useContext( DataViewsContext );

	const selectedItems = useMemo(
		() =>
			data.filter( ( item ) => selection.includes( getItemId( item ) ) ),
		[ selection, getItemId, data ]
	);

	if ( ! actions.length ) {
		return null;
	}

	return (
		<div className="dataviews-picker-footer__actions">
			<ActionButtons
				actions={ actions }
				items={ selectedItems }
				selection={ selection }
			/>
		</div>
	);
}

// The bulk-selection info and action buttons without pagination — the picker
// counterpart to `DataViews.BulkActionToolbar`, for free composition.
export function DataViewsPickerBulkActionToolbar() {
	return (
		<Stack direction="row" gap="md" align="center">
			<PickerBulkSelectionInfo />
			<DataViewsPickerActions />
		</Stack>
	);
}

// The full picker footer: bulk-selection info, pagination, and actions — the
// picker counterpart to `DataViews.Footer`, and structured like it so that the
// footer stacks its rows in narrow containers, such as a sidebar. Given
// children, it renders those in place of the default contents, so a picker
// can compose its footer from `DataViewsPicker.Pagination` and
// `DataViewsPicker.Actions` alone, for instance.
export function DataViewsPickerFooter( {
	children,
}: {
	children?: ReactNode;
} ) {
	const {
		actions = EMPTY_ARRAY,
		paginationInfo,
		view,
	} = useContext( DataViewsContext );

	if (
		! children &&
		! actions.length &&
		! hasPaginationControls( view, paginationInfo )
	) {
		return null;
	}

	return (
		<div className="dataviews-footer">
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className="dataviews-footer__content"
				gap="sm"
			>
				{ children || (
					<>
						<PickerBulkSelectionInfo />
						<DataViewsPagination />
						<DataViewsPickerActions />
					</>
				) }
			</Stack>
		</div>
	);
}
