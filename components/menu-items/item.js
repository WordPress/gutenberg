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
 * Renders the more menu item.
 *
 * @return {WPElement} More menu item.
 */
function MenuItemsItem( { className, icon, isSelected = false, label, onClick, shortcut } ) {
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
