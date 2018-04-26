/**
 * WordPress dependencies
 */
import { compose, Fragment } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { IconButton, MenuItem } from '@wordpress/components';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PinnedPlugins from '../pinned-plugins';
import PluginsMoreMenuGroup from '../plugins-more-menu-group';

const PluginSidebarMoreMenuItem = ( { children, isSelected, icon, onClick } ) => (
	<Fragment>
		{ icon && (
			<PinnedPlugins>
				<IconButton
					icon={ icon }
					label={ children }
					onClick={ onClick }
					isToggled={ isSelected }
					aria-expanded={ isSelected }
				/>
			</PinnedPlugins>
		) }
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
	</Fragment>
);

export default compose(
	withPluginContext,
	withSelect( ( select, ownProps ) => {
		const { pluginContext, target } = ownProps;
		const sidebarName = `${ pluginContext.name }/${ target }`;

		return {
			isSelected: select( 'core/edit-post' ).getActiveGeneralSidebarName() === sidebarName,
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
