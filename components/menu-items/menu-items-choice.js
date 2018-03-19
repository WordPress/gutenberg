/**
 * Internal dependencies
 */
import './style.scss';
import MenuItemsToggle from './menu-items-toggle';

export default function MenuItemsChoice( {
	choices = [],
	onSelect,
	value,
} ) {
	return choices.map( ( item ) => {
		const isSelected = value === item.value;
		return (
			<MenuItemsToggle
				key={ item.value }
				label={ item.label }
				isSelected={ isSelected }
				shortcut={ item.shortcut }
				onClick={ () => {
					if ( ! isSelected ) {
						onSelect( item.value );
					}
				} }
			/>
		);
	} );
}
