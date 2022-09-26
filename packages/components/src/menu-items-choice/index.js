/**
 * WordPress dependencies
 */
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MenuItem from '../menu-item';

const noop = () => {};

export default function MenuItemsChoice( {
	choices = [],
	onHover = noop,
	onSelect,
	value,
} ) {
	return choices.map( ( item ) => {
		const isSelected = value === item.value;
		return (
			<MenuItem
				key={ item.value }
				role="menuitemradio"
				icon={ isSelected && check }
				info={ item.info }
				isSelected={ isSelected }
				shortcut={ item.shortcut }
				className="components-menu-items-choice"
				onClick={ () => {
					if ( ! isSelected ) {
						onSelect( item.value );
					}
				} }
				onMouseEnter={ () => onHover( item.value ) }
				onMouseLeave={ () => onHover( null ) }
				aria-label={ item[ 'aria-label' ] }
			>
				{ item.label }
			</MenuItem>
		);
	} );
}
