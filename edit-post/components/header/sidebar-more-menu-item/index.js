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
import { withMoreMenuContext } from '../more-menu-context';

const SidebarMoreMenuItem = ( { children, isSelected, icon, onClick } ) => (
	<MenuItem
		icon={ isSelected ? 'yes' : icon }
		isSelected={ isSelected }
		onClick={ onClick }
	>
		{ children }
	</MenuItem>
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
	withMoreMenuContext,
	withDispatch( ( dispatch, { isSelected, moreMenuContext, sidebarName } ) => {
		const {
			closeGeneralSidebar,
			openGeneralSidebar,
		} = dispatch( 'core/edit-post' );
		const onClick = isSelected ?
			closeGeneralSidebar :
			() => openGeneralSidebar( sidebarName );
		return {
			onClick: compose( onClick, moreMenuContext.onClose ),
		};
	} ),
)( SidebarMoreMenuItem );
