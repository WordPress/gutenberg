/**
 * WordPress dependencies
 */
import { withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';

export function PreferencesMenuItem( { openModal } ) {
	return (
		<MenuItem
			onClick={ () => {
				openModal( 'edit-post/preferences' );
			} }
		>
			{ __( 'Preferences' ) }
		</MenuItem>
	);
}

export default withDispatch( ( dispatch ) => {
	const { openModal } = dispatch( 'core/edit-post' );

	return {
		openModal,
	};
} )( PreferencesMenuItem );
