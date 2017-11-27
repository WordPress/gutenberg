/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import Button from '../button';
import './style.scss';

function MenuItemsToggle( { label, isSelected, onClick } ) {
	if ( isSelected ) {
		return (
			<IconButton
				className="components-menu-items__toggle is-selected"
				icon="yes"
				onClick={ onClick }
			>
				{ label }
			</IconButton>
		);
	}

	return (
		<Button
			className="components-menu-items__toggle"
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}

export default MenuItemsToggle;
