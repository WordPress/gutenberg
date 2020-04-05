/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export function ManageBlocksMenuItem( { openModal } ) {
	return (
		<MenuItem
			onClick={ () => {
				openModal( 'edit-post/manage-blocks' );
			} }
		>
			{ __( 'Block Manager' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( 'core/edit-post' );

	return {
		openModal,
	};
} )( ManageBlocksMenuItem );
