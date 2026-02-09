/**
 * WordPress dependencies
 */
import { Button, CheckboxControl } from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useContext, useMemo, useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViewsPagination from '../dataviews-pagination';
import DataViewsContext from '../dataviews-context';
import type { SetSelection } from '../../types/private';
import type { Action } from '../../types';
import getFooterMessage from '../../utils/get-footer-message';
import useSelectedItems from '../../hooks/use-selected-items';

const EMPTY_ARRAY: [] = [];

export function useIsMultiselectPicker< Item >(
	actions: Action< Item >[] | undefined
) {
	return useMemo( () => {
		return actions?.every( ( action ) => action.supportsBulk );
	}, [ actions ] );
}

function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	getItemId,
}: {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	getItemId: ( item: Item ) => string;
} ) {
	const { view, isSelectAllMode, setIsSelectAllMode } =
		useContext( DataViewsContext );

	const selectedItems = useSelectedItems(
		view,
		data,
		selection,
		getItemId,
		undefined,
		isSelectAllMode
	);

	const infiniteScrollEnabled = view.infiniteScrollEnabled;

	// In select all mode, all are selected if deselection list is empty
	// In normal mode, all are selected if all items are in selection
	const areAllSelected = isSelectAllMode
		? selection.length === 0
		: selectedItems.length === data.length;

	// Determine if there's any selection
	// In select all mode: has selection if deselection list doesn't include all items
	// In normal mode: has selection if any items are selected
	const hasSelection = isSelectAllMode
		? selection.length < data.length // Some items still selected
		: selectedItems.length > 0;

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && hasSelection }
			onChange={ () => {
				if ( infiniteScrollEnabled ) {
					// For infinite scroll, toggle isSelectAllMode
					if ( isSelectAllMode ) {
						// Deselect all: clear selection and disable select all mode
						setIsSelectAllMode( false );
						onChangeSelection( [] );
					} else {
						// Select all: enable select all mode with empty deselection list
						setIsSelectAllMode( true );
						onChangeSelection( [] );
					}
				} else if ( areAllSelected ) {
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

				const { id, label, icon, isPrimary, callback } = action;

				const _label =
					typeof label === 'string' ? label : label( items );
				const variant = isPrimary ? 'primary' : 'tertiary';
				const isInProgress = id === actionInProgress;

				return (
					<Button
						key={ id }
						accessibleWhenDisabled
						icon={ icon }
						disabled={ isInProgress || ! selection?.length }
						isBusy={ isInProgress }
						onClick={ async () => {
							setActionInProgress( id );
							await callback( items, {
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

export function DataViewsPickerFooter() {
	const {
		data,
		selection,
		onChangeSelection,
		getItemId,
		actions = EMPTY_ARRAY,
		paginationInfo,
		view,
		isSelectAllMode,
	} = useContext( DataViewsContext );

	const isMultiselect = useIsMultiselectPicker( actions );

	const message = getFooterMessage(
		selection.length,
		data.length,
		paginationInfo.totalItems,
		view.infiniteScrollEnabled, // onlyTotalCount
		isSelectAllMode
	);

	const selectedItems = useSelectedItems(
		view,
		data,
		selection,
		getItemId,
		undefined,
		isSelectAllMode
	);

	return (
		<Stack
			direction="row"
			justify="space-between"
			align="center"
			className="dataviews-footer"
			gap="sm"
		>
			<Stack
				direction="row"
				className="dataviews-picker-footer__bulk-selection"
				gap="md"
				align="center"
			>
				{ isMultiselect && (
					<BulkSelectionCheckbox
						selection={ selection }
						onChangeSelection={ onChangeSelection }
						data={ data }
						getItemId={ getItemId }
					/>
				) }
				<span className="dataviews-bulk-actions-footer__item-count">
					{ message }
				</span>
			</Stack>
			<DataViewsPagination />
			{ Boolean( actions?.length ) && (
				<div className="dataviews-picker-footer__actions">
					<ActionButtons
						actions={ actions }
						items={ selectedItems }
						selection={ selection }
					/>
				</div>
			) }
		</Stack>
	);
}
