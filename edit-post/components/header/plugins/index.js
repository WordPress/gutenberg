/**
 * External dependencies
 */
import { map, isEmpty, isString } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, IconButton, MenuItemsGroup } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getMoreMenuItems } from '../../../api/more-menu-item';

/**
 * Renders a list of plugins that will activate different UI elements.
 *
 * @param {Object} props The component props.
 *
 * @return {Object} The rendered list of menu items.
 */
function Plugins( props ) {
	const ellipsisMenuItems = getMoreMenuItems();

	if ( isEmpty( ellipsisMenuItems ) ) {
		return null;
	}

	/**
	 * Handles the user clicking on one of the plugins in the menu
	 *
	 * @param {string} pluginId The plugin id.
	 *
	 * @return {void}
	 */
	function onSelect( pluginId ) {
		props.onSelect();
		ellipsisMenuItems[ pluginId ].callback();
	}

	return (
		<MenuItemsGroup
			label={ __( 'Plugins' ) }
			filterName="editPost.MoreMenu.plugins" >
			{ map( ellipsisMenuItems, menuItem => {
				if ( isString( menuItem.icon ) ) {
					menuItem.icon = null;
				}
				const pluginActive = menuItem.target === props.activePlugin;

				let Icon = menuItem.icon ? (
					<span className="edit-post-plugins__icon-container" >
						{ menuItem.icon }
					</span>
				) : null;

				if ( pluginActive ) {
					Icon = 'yes';
				}

				const buttonClassName = classnames(
					'edit-post-plugins__button',
					{
						'has-icon': Icon,
						'is-active': pluginActive,
					}
				);

				return (
					<IconButton
						key={ menuItem.menuItemId }
						className={ buttonClassName }
						icon={ Icon }
						onClick={ () => onSelect( menuItem.menuItemId ) }>
						{ menuItem.title }
					</IconButton>
				);
			} ) }
		</MenuItemsGroup>
	);
}

export default compose( [
	withSelect( select => {
		const editPost = select( 'core/edit-post' );
		const openedSidebar = editPost.getOpenedGeneralSidebar();
		if ( openedSidebar !== 'plugin' ) {
			return {};
		}

		return {
			activePlugin: editPost.getActivePlugin(),
		};
	} ),
	withInstanceId,
] )( Plugins );
