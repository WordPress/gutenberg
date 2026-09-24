import type { ReactNode } from 'react';
import clsx from 'clsx';
import {
	Button,
	CheckboxControl as WCCheckboxControl,
} from '@wordpress/components';
import { useRegistry } from '@wordpress/data';
import { useContext, useMemo, useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import DataViewsPagination from '../dataviews-pagination';
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
			<WCCheckboxControl
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
		<WCCheckboxControl
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

				// `items` holds the current page's selection only, so an
				// action without `isEligible` stays enabled for a selection
				// made on other pages.
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
							( !! isEligible && ! eligibleItems.length )
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

export function PickerActions( { className }: { className?: string } ) {
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
		<div
			className={ clsx( 'dataviews-picker-footer__actions', className ) }
		>
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
export function DataViewsPickerBulkActionToolbar( {
	className,
}: {
	className?: string;
} ) {
	return (
		<Stack direction="row" gap="md" align="center" className={ className }>
			<PickerBulkSelectionInfo />
			<PickerActions />
		</Stack>
	);
}

// The full picker footer: bulk-selection info, pagination, and actions — the
// picker counterpart to `DataViews.Footer`. Given children, it renders those
// in their place instead.
export function DataViewsPickerFooter( {
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
} ) {
	const {
		actions = EMPTY_ARRAY,
		paginationInfo,
		view,
	} = useContext( DataViewsContext );

	const hasPagination =
		! view.infiniteScrollEnabled &&
		!! paginationInfo.totalItems &&
		paginationInfo.totalPages > 1;

	// Without actions and without pagination every default part renders
	// nothing, leaving the row's border and padding around an empty line. The
	// check belongs to those parts alone: children are the consumer's, and
	// what they need is not something this can work out.
	const rendersDefaultContents = children === undefined || children === null;
	if ( rendersDefaultContents && ! actions.length && ! hasPagination ) {
		return null;
	}

	return (
		<Stack
			direction="row"
			justify="space-between"
			align="center"
			className={ clsx( 'dataviews-footer', className ) }
			gap="sm"
		>
			{ children ?? (
				<>
					<PickerBulkSelectionInfo />
					<DataViewsPagination />
					<PickerActions />
				</>
			) }
		</Stack>
	);
}
