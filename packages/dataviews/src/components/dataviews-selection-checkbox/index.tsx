import { Checkbox, Radio, RadioGroup } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
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
	/**
	 * Whether more than one item can be selected. When `false`, a radio button
	 * is rendered instead of a checkbox, so single-selection views read as
	 * "pick one".
	 *
	 * @default true
	 */
	isMultiselect?: boolean;
}

export default function DataViewsSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	item,
	getItemId,
	titleField,
	disabled,
	isMultiselect = true,
	...extraProps
}: DataViewsSelectionCheckboxProps< Item > ) {
	const id = getItemId( item );
	const isInSelectionArray = selection.includes( id );
	const checked = ! disabled && isInSelectionArray;

	// Fallback label to ensure accessibility
	const selectionLabel =
		titleField?.getValue?.( { item } ) || __( '(no title)' );

	if ( ! isMultiselect ) {
		// The radio is a display-only indicator: the row (or card) owns the
		// selection, so the group is read-only and its value mirrors the
		// selection. A disabled (non-selectable) item is never checked.
		return (
			<RadioGroup
				value={ checked ? id : null }
				readOnly
				render={ <span className={ SELECTION_CHECKBOX_CLASS } /> }
				{ ...extraProps }
			>
				<Radio
					value={ id }
					disabled={ disabled }
					tabIndex={ -1 }
					aria-label={ selectionLabel }
				/>
			</RadioGroup>
		);
	}

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
