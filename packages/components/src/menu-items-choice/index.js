/**
 * Internal dependencies
 */
import MenuItem from '../menu-item';

export default function MenuItemsChoice( {
	choices = [],
	onSelect,
	value,
} ) {
	return choices.map( ( item ) => {
		const isSelected = value === item.value;
		return (
			<MenuItem
				key={ item.value }
				role="menuitemradio"
				icon={ isSelected && 'yes' }
				isSelected={ isSelected }
				shortcut={ item.shortcut }
				className="components-menu-items-choice"
				onClick={ () => {
					if ( ! isSelected ) {
						onSelect( item.value );
					}
				} }
			>
				{ item.label }
			</MenuItem>
		);
	} );
}
