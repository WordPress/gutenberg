/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PluginsMoreMenuGroup from '../plugins-more-menu-group';

const PluginSidebarMoreMenuItem = ( { children, icon, isSelected, onClick } ) => (
	<PluginsMoreMenuGroup>
		{ ( fillProps ) => (
			<MenuItem
				icon={ isSelected ? 'yes' : icon }
				isSelected={ isSelected }
				onClick={ compose( onClick, fillProps.onClose ) }
			>
				{ children }
			</MenuItem>
		) }
	</PluginsMoreMenuGroup>
);

export default compose(
	withPluginContext,
	withSelect( ( select, ownProps ) => {
		const {
			getActiveGeneralSidebarName,
		} = select( 'core/edit-post' );
		const { pluginContext, target } = ownProps;
		const sidebarName = `${ pluginContext.name }/${ target }`;

		return {
			isSelected: getActiveGeneralSidebarName() === sidebarName,
			sidebarName,
		};
	} ),
	withDispatch( ( dispatch, { isSelected, sidebarName } ) => {
		const {
			closeGeneralSidebar,
			openGeneralSidebar,
		} = dispatch( 'core/edit-post' );
		const onClick = isSelected ?
			closeGeneralSidebar :
			() => openGeneralSidebar( sidebarName );

		return { onClick };
	} ),
)( PluginSidebarMoreMenuItem );
