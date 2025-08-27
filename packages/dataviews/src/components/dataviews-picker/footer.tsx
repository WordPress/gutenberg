/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	CheckboxControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsPagination from '../dataviews-pagination';
import DataViewsContext from '../dataviews-context';
import type { SetSelection } from '../../private-types';

interface BulkSelectionCheckboxProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	getItemId: ( item: Item ) => string;
}

function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	getItemId,
}: BulkSelectionCheckboxProps< Item > ) {
	const areAllSelected = selection.length === data.length;

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			__nextHasNoMarginBottom
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && !! selection.length }
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

export function DataViewsPickerFooter( {
	children,
}: {
	multiselect?: boolean;
	children: ReactNode;
} ) {
	const { data, selection, onChangeSelection, getItemId, picker } =
		useContext( DataViewsContext );

	const selectionCount = selection.length;

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

	return (
		<HStack expanded={ false } justify="end" className="dataviews-footer">
			<HStack
				expanded={ false }
				className="dataviews-bulk-actions-footer__container"
				spacing={ 3 }
			>
				{ picker?.multiselect && (
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
				<DataViewsPagination />
				<HStack
					className="dataviews-bulk-actions-footer__action-buttons"
					expanded={ false }
					spacing={ 1 }
				>
					{ children }
				</HStack>
			</HStack>
		</HStack>
	);
}
