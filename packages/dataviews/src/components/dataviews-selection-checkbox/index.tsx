import { CheckboxControl as WCCheckboxControl } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import { Icon, Tooltip } from '@wordpress/ui';
import DataViewsContext from '../dataviews-context';
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
	const { isItemLocked } = useContext( DataViewsContext );
	const id = getItemId( item );
	const isInSelectionArray = selection.includes( id );
	const checked = ! disabled && isInSelectionArray;

	// Fallback label to ensure accessibility
	const selectionLabel =
		titleField?.getValue?.( { item } ) || __( '(no title)' );

	// A locked item can't be selected, so it shows a lock in place of the
	// checkbox, like the list tables of WordPress.
	if ( isItemLocked( item ) ) {
		const lockedLabel = sprintf(
			/* translators: %s: The title of the item. */
			__( '"%s" is locked' ),
			selectionLabel
		);
		return (
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<span
							className="dataviews-selection-checkbox__lock"
							role="img"
							aria-label={ lockedLabel }
						/>
					}
				>
					<Icon icon={ lock } size={ 16 } />
				</Tooltip.Trigger>
				<Tooltip.Popup>{ __( 'Locked' ) }</Tooltip.Popup>
			</Tooltip.Root>
		);
	}

	return (
		<WCCheckboxControl
			className={ SELECTION_CHECKBOX_CLASS }
			aria-label={ selectionLabel }
			aria-disabled={ disabled }
			checked={ checked }
			onChange={ () => {
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
