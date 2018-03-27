/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItemsItem } from '@wordpress/components';

const PluginSidebarMoreMenuItem = ( { isSelected, icon, label, onClick } ) => (
	<MenuItemsItem
		icon={ isSelected ? 'yes' : icon }
		isSelected={ isSelected }
		label={ label }
		onClick={ onClick }
	/>
);

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { target } = ownProps;
		return {
			isSelected: select( 'core/edit-post' ).getActiveGeneralSidebarName() === target,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { target, isSelected } = ownProps;
		const {
			closeGeneralSidebar,
			openGeneralSidebar,
		} = dispatch( 'core/edit-post' );
		const onClick = isSelected ?
			closeGeneralSidebar :
			() => openGeneralSidebar( target );
		return {
			onClick: () => {
				ownProps.onClick();
				onClick();
			},
		};
	} ),
] )( PluginSidebarMoreMenuItem );
