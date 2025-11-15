/**
 * WordPress dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { SetSelection } from '../../types/private';
import type { NormalizedField } from '../../types';

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
	const id = getItemId( item );
	const checked = ! disabled && selection.includes( id );

	// Fallback label to ensure accessibility
	const selectionLabel =
		titleField?.getValue?.( { item } ) || __( '(no title)' );

	return (
		<CheckboxControl
			className="dataviews-selection-checkbox"
			__nextHasNoMarginBottom
			aria-label={ selectionLabel }
			aria-disabled={ disabled }
			checked={ checked }
			onChange={ () => {
				if ( disabled ) {
					return;
				}

				onChangeSelection(
					selection.includes( id )
						? selection.filter( ( itemId ) => id !== itemId )
						: [ ...selection, id ]
				);
			} }
			{ ...extraProps }
		/>
	);
}
