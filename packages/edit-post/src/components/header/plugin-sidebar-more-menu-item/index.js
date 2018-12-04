/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { withPluginContext } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import PluginMoreMenuItem from '../plugin-more-menu-item';

const PluginSidebarMoreMenuItem = ( { children, icon, isSelected, onClick } ) => (
	<PluginMoreMenuItem
		icon={ isSelected ? 'yes' : icon }
		isSelected={ isSelected }
		role="menuitemcheckbox"
		onClick={ onClick }
	>
		{ children }
	</PluginMoreMenuItem>
);

export default compose(
	withPluginContext( ( context, ownProps ) => {
		return {
			icon: ownProps.icon || context.icon,
			sidebarName: `${ context.name }/${ ownProps.target }`,
		};
	} ),
	withSelect( ( select, { sidebarName } ) => {
		const {
			getActiveGeneralSidebarName,
		} = select( 'core/edit-post' );

		return {
			isSelected: getActiveGeneralSidebarName() === sidebarName,
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
