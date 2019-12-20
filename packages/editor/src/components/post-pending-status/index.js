/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostPendingStatusCheck from './check';

export function PostPendingStatus( { status, onUpdateStatus } ) {
	const togglePendingStatus = () => {
		const updatedStatus = status === 'pending' ? 'draft' : 'pending';
		onUpdateStatus( updatedStatus );
	};

	return (
		<PostPendingStatusCheck>
			<CheckboxControl
				label={ __( 'Pending Review' ) }
				checked={ status === 'pending' }
				onChange={ togglePendingStatus }
			/>
		</PostPendingStatusCheck>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		status: select( 'core/editor' ).getEditedPostAttribute( 'status' ),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		onUpdateStatus( status ) {
			dispatch( 'core/editor' ).editPost( { status } );
		},
	} ) ),
)( PostPendingStatus );
