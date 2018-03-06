/**
 * Internal dependencies
 */
import Button from '../button';
import Shortcut from './menu-items-shortcut';
import IconButton from '../icon-button';
import './style.scss';

function MenuItemsToggle( { label, isSelected, onClick, shortcut } ) {
	if ( isSelected ) {
		return (
			<IconButton
				className="components-menu-items__button is-toggle is-selected"
				icon="yes"
				onClick={ onClick }
			>
				{ label }
				<Shortcut shortcut={ shortcut } />
			</IconButton>
		);
	}

	return (
		<Button
			className="components-menu-items__button is-toggle"
			onClick={ onClick }
		>
			{ label }
			<Shortcut shortcut={ shortcut } />
		</Button>
	);
}

export default MenuItemsToggle;
