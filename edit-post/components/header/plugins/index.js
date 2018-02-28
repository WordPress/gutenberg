/**
 * External dependencies
 */
import { map, isEmpty, isString } from 'lodash';
import classnames from 'classnames';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, IconButton, MenuItemsGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getMoreMenuItems } from '../../../api';
import { getActivePlugin, getOpenedGeneralSidebar } from '../../../store/selectors';

/**
 * Renders a list of plugins that will activate different UI elements.
 *
 * @param   {Object} props The component props.
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
	 * Does nothing currently, but should be used to trigger the plugins sidebar
	 *
	 * @param {string} pluginId The plugin id.
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
			{
				map( ellipsisMenuItems, menuItem => {
					if ( isString( menuItem.icon ) ) {
						menuItem.icon = null;
					}
					const pluginActive = menuItem.target === props.activePlugin;

					let Icon = menuItem.icon ? (
						<div className="components-menu-item-plugins__icon-container" >
							{ menuItem.icon }
						</div>
					) : null;

					if ( pluginActive ) {
						Icon = 'yes';
					}

					const buttonClassName = classnames(
						'components-menu-item-plugins__button',
						Icon ? 'has-icon' : null,
						pluginActive ? 'active' : null,
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
				} )
			}
		</MenuItemsGroup>
	);
}

export default connect( state => {
	return {
		activePlugin: getOpenedGeneralSidebar( state ) === 'plugin' ?
			getActivePlugin( state ) : null,
	};
}, null, null, { storeKey: 'edit-post' } )( withInstanceId( Plugins ) );
