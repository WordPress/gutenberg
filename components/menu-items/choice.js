/**
 * Internal dependencies
 */
import './style.scss';
import MenuItemsItem from './item';

export default function MenuItemsChoice( {
	choices = [],
	onSelect,
	value,
} ) {
	return choices.map( ( item ) => {
		const isSelected = value === item.value;
		return (
			<MenuItemsItem
				key={ item.value }
				icon={ isSelected && 'yes' }
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
