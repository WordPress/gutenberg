/**
 * WordPress dependencies
 */
import { compose, createHigherOrderComponent } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { PluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PluginsMoreMenuGroup from '../plugins-more-menu-group';

const PluginSidebarMoreMenuItem = ( { children, isSelected, icon, onClick } ) => (
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
	createHigherOrderComponent(
		( OriginalComponent ) => ( props ) => (
			<PluginContext.Consumer>
				{ ( { pluginName } ) => (
					<OriginalComponent
						{ ...props }
						pluginName={ pluginName }
					/>
				) }
			</PluginContext.Consumer>
		),
		'withPluginContext'
	),
	withSelect( ( select, ownProps ) => {
		const { pluginName, target } = ownProps;
		const sidebarName = `${ pluginName }/${ target }`;

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
