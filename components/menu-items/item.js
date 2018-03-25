/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Button from '../button';
import Shortcut from './shortcut';
import IconButton from '../icon-button';
import './style.scss';

/**
 * Renders a generic menu item for use inside the more menu.
 *
 * @return {WPElement} More menu item.
 */
function MenuItemsItem( { className, icon, label, onClick, shortcut, isSelected = false } ) {
	className = classnames( 'components-menu-items__button', {
		[ className ]: Boolean( className ),
		'is-selected': isSelected,
	} );

	if ( icon ) {
		return (
			<IconButton
				className={ className }
				icon={ icon }
				onClick={ onClick }
				aria-pressed={ isSelected }
			>
				{ label }
				<Shortcut shortcut={ shortcut } />
			</IconButton>
		);
	}

	return (
		<Button
			className={ className }
			onClick={ onClick }
			aria-pressed={ isSelected }
		>
			{ label }
			<Shortcut shortcut={ shortcut } />
		</Button>
	);
}

export default MenuItemsItem;
