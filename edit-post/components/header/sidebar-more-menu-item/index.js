/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';

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
	withMoreMenuContext,
	withSelect( ( select, ownProps ) => {
		const { target } = ownProps;
		return {
			isSelected: select( 'core/edit-post' ).getActiveGeneralSidebarName() === target,
		};
	} ),
	withDispatch( ( dispatch, { isSelected, moreMenuContext, target } ) => {
		const {
			closeGeneralSidebar,
			openGeneralSidebar,
		} = dispatch( 'core/edit-post' );
		const onClick = isSelected ?
			closeGeneralSidebar :
			() => openGeneralSidebar( target );
		return {
			onClick: compose( onClick, moreMenuContext.onClose ),
		};
	} ),
)( SidebarMoreMenuItem );
