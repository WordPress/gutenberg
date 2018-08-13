/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

function FocusModeMenuItem( { isFocusMode, toggleFocusMode } ) {
	return (
		<MenuItem
			icon={ isFocusMode && 'yes' }
			onClick={ toggleFocusMode }
		>
			{ __( 'Focus Mode' ) }
		</MenuItem>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		isFocusMode: select( 'core/edit-post' ).isFocusMode(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { toggleFocusMode } = dispatch( 'core/edit-post' );
		return {
			toggleFocusMode: toggleFocusMode,
		};
	} ),
)( FocusModeMenuItem );
