/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { SetSelection } from '../../types/private';
import type { NormalizedField } from '../../types';
import DataViewsContext from '../dataviews-context';

interface DataViewsSelectionCheckboxProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	item: Item;
	getItemId: ( item: Item ) => string;
	titleField?: NormalizedField< Item >;
	disabled: boolean;
	tabIndex?: number;
}

export default function DataViewsSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	item,
	getItemId,
	titleField,
	disabled,
	...extraProps
}: DataViewsSelectionCheckboxProps< Item > ) {
	const { isSelectAllMode } = useContext( DataViewsContext );
	const id = getItemId( item );

	// In select all mode, selection array is a deselection list:
	// - Item is selected if NOT in the array
	// In normal mode:
	// - Item is selected if IN the array
	const isInSelectionArray = selection.includes( id );
	const checked =
		! disabled &&
		( isSelectAllMode ? ! isInSelectionArray : isInSelectionArray );

	// Fallback label to ensure accessibility
	const selectionLabel =
		titleField?.getValue?.( { item } ) || __( '(no title)' );

	return (
		<CheckboxControl
			className="dataviews-selection-checkbox"
			aria-label={ selectionLabel }
			aria-disabled={ disabled }
			checked={ checked }
			onChange={ () => {
				if ( disabled ) {
					return;
				}

				// Toggle in/out of selection array
				// In normal mode: adds/removes from selection
				// In select all mode: adds/removes from deselection list
				onChangeSelection(
					isInSelectionArray
						? selection.filter( ( itemId ) => id !== itemId )
						: [ ...selection, id ]
				);
			} }
			{ ...extraProps }
		/>
	);
}
