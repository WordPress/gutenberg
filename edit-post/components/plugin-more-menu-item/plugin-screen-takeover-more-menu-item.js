/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';

const PluginScreenTakeoverMoreMenuItem = ( { children, isSelected, icon, onClick } ) => (
	<MenuItem
		icon={ isSelected ? 'yes' : icon }
		isSelected={ isSelected }
		onClick={ onClick }
	>
		{ children }
	</MenuItem>
);

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { target } = ownProps;
		return {
			isSelected: select( 'core/edit-post' ).getActiveScreenTakeoverName() === target,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { target, isSelected } = ownProps;
		const {
			openScreenTakeover,
			closeScreenTakeover,
		} = dispatch( 'core/edit-post' );
		const onClick = isSelected ?
			closeScreenTakeover :
			() => openScreenTakeover( target );
		return {
			onClick: () => {
				ownProps.onClick();
				onClick();
			},
		};
	} ),
] )( PluginScreenTakeoverMoreMenuItem );
