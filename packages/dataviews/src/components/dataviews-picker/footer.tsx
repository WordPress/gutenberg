/**
 * WordPress dependencies
 */
import {
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useContext, useMemo, useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DataViewsPagination from '../dataviews-pagination';
import DataViewsContext from '../dataviews-context';
import type { SetSelection } from '../../types/private';
import type { Action } from '../../types';

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
}: {
	selection: string[];
	selectedItems: Item[];
	onChangeSelection: SetSelection;
	data: Item[];
	getItemId: ( item: Item ) => string;
} ) {
	const areAllSelected = selectedItems.length === data.length;

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			__nextHasNoMarginBottom
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
		<HStack expanded={ false } spacing={ 1 }>
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
		</HStack>
	);
}

export function DataViewsPickerFooter() {
	const {
		data,
		selection,
		onChangeSelection,
		getItemId,
		actions = EMPTY_ARRAY,
	} = useContext( DataViewsContext );

	const selectionCount = selection.length;
	const isMultiselect = useIsMultiselectPicker( actions );

	const message =
		selectionCount > 0
			? sprintf(
					/* translators: %d: number of items. */
					_n(
						'%d Item selected',
						'%d Items selected',
						selectionCount
					),
					selectionCount
			  )
			: sprintf(
					/* translators: %d: number of items. */
					_n( '%d Item', '%d Items', data.length ),
					data.length
			  );

	const selectedItems = useMemo(
		() =>
			data.filter( ( item ) => selection.includes( getItemId( item ) ) ),
		[ selection, getItemId, data ]
	);

	return (
		<HStack
			expanded={ false }
			justify="space-between"
			className="dataviews-footer"
		>
			<HStack
				className="dataviews-picker-footer__bulk-selection"
				expanded={ false }
				spacing={ 3 }
			>
				{ isMultiselect && (
					<BulkSelectionCheckbox
						selection={ selection }
						selectedItems={ selectedItems }
						onChangeSelection={ onChangeSelection }
						data={ data }
						getItemId={ getItemId }
					/>
				) }
				<span className="dataviews-bulk-actions-footer__item-count">
					{ message }
				</span>
			</HStack>
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
		</HStack>
	);
}
