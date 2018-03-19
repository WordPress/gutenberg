/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Renders the more menu item layout.
 *
 * @return {WPElement} More menu item layout.
 */
function MoreMenuItemLayout( { title, icon, isActive, onClick } ) {
	icon = icon ? (
		<span className="edit-post-plugin-more-menu-item__more-menu-item-layout__icon-container">
			{ icon }
		</span>
	) : null;
	icon = isActive ? 'yes' : icon;

	const className = classnames( 'edit-post-plugin-more-menu-item__more-menu-item-layout', {
		'is-active': isActive,
		'has-icon': icon,
	} );

	return (
		<IconButton
			icon={ icon }
			onClick={ onClick }
			className={ className }>
			{ title }
		</IconButton>
	);
}

export default MoreMenuItemLayout;
