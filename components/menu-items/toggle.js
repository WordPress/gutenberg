/**
 * Internal dependencies
 */
import MenuItemsItem from './item';
import './style.scss';

/**
 * Renders the more menu toggle.
 *
 * @return {WPElement} More menu toggle.
 */
function MenuItemsToggle( { label, isSelected, onClick, shortcut } ) {
	return (
		<MenuItemsItem
			className="is-toggle"
			icon={ isSelected && 'yes' }
			onClick={ onClick }
			label={ label }
			isSelected={ isSelected }
			shortcut={ shortcut }
		/>
	);
}

export default MenuItemsToggle;
