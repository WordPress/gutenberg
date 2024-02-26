/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { CheckboxControl, Tooltip } from '@wordpress/components';

export default function SingleSelectionCheckbox( {
	selection,
	onSelectionChange,
	item,
	data,
	getItemId,
	primaryField,
	disabled,
} ) {
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	let selectionLabel;
	if ( primaryField?.getValue && item ) {
		// eslint-disable-next-line @wordpress/valid-sprintf
		selectionLabel = sprintf(
			/* translators: %s: item title. */
			isSelected ? __( 'Deselect item: %s' ) : __( 'Select item: %s' ),
			primaryField.getValue( { item } )
		);
	} else {
		selectionLabel = isSelected
			? __( 'Select a new item' )
			: __( 'Deselect item' );
	}
	return (
		<Tooltip
			text={ disabled ? __( 'Bulk actions are not applicable' ) : null }
		>
			<CheckboxControl
				className="dataviews-view-table-selection-checkbox"
				__nextHasNoMarginBottom
				label={ selectionLabel }
				aria-disabled={ disabled }
				checked={ disabled ? false : isSelected }
				onChange={ () => {
					if ( ! isSelected ) {
						onSelectionChange(
							data.filter( ( _item ) => {
								const itemId = getItemId?.( _item );
								return (
									itemId === id ||
									selection.includes( itemId )
								);
							} )
						);
					} else {
						onSelectionChange(
							data.filter( ( _item ) => {
								const itemId = getItemId?.( _item );
								return (
									itemId !== id &&
									selection.includes( itemId )
								);
							} )
						);
					}
				} }
			/>
		</Tooltip>
	);
}
