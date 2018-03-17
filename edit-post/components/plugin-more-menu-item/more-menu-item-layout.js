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
	return (
		<div className="edit-post-plugin-more-menu-item__more-menu-item-layout">
			{ title }
		</div>
	);
}

export default MoreMenuItemLayout;
