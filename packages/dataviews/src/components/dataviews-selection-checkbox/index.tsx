import { Checkbox } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import type { SetSelection } from '../../types/private';
import type { NormalizedField } from '../../types';

// This class is also used elsewhere to detect the selection checkbox.
export const SELECTION_CHECKBOX_CLASS = 'dataviews-selection-checkbox';

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
	const isInSelectionArray = selection.includes( id );
	const checked = ! disabled && isInSelectionArray;

	// Name the action as well as the item, as the list tables do.
	const selectionLabel = sprintf(
		/* translators: %s: The title of the item. */
		__( 'Select %s' ),
		titleField?.getValue?.( { item } ) || __( '(no title)' )
	);

	return (
		<Checkbox
			className={ SELECTION_CHECKBOX_CLASS }
			aria-label={ selectionLabel }
			aria-disabled={ disabled }
			checked={ checked }
			onCheckedChange={ () => {
				if ( disabled ) {
					return;
				}

				// Toggle in/out of selection array
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
