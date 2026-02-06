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
	selectedItems,
	onChangeSelection,
	data,
	getItemId,
	infiniteScrollEnabled,
}: {
	selection: string[];
	selectedItems: Item[];
	onChangeSelection: SetSelection;
	data: Item[];
	getItemId: ( item: Item ) => string;
	infiniteScrollEnabled?: boolean;
} ) {
	const areAllSelected = selectedItems.length === data.length;
	// For infinite scroll, use selection.length to determine indeterminate state
	// since selected items may have scrolled out of view.
	const hasSelection = infiniteScrollEnabled
		? selection.length > 0
		: selectedItems.length > 0;

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && hasSelection }
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
	} = useContext( DataViewsContext );

	const isMultiselect = useIsMultiselectPicker( actions );

	const message = getFooterMessage(
		selection.length,
		data.length,
		paginationInfo.totalItems,
		view.infiniteScrollEnabled
	);

	const selectedItems = useSelectedItems( view, data, selection, getItemId );

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
						selectedItems={ selectedItems }
						onChangeSelection={ onChangeSelection }
						data={ data }
						getItemId={ getItemId }
						infiniteScrollEnabled={ view.infiniteScrollEnabled }
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
