/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostPendingStatusCheck from './check';
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

export function PostPendingStatus( { status, onUpdateStatus } ) {
	const togglePendingStatus = () => {
		const updatedStatus = status === 'pending' ? 'draft' : 'pending';
		onUpdateStatus( updatedStatus );
	};

	return (
		<PostPendingStatusCheck>
			<ToggleControl
				label={ __( 'Pending Review' ) }
				checked={ status === 'pending' }
				onChange={ togglePendingStatus }
				showHint={ false }
			/>
		</PostPendingStatusCheck>
	);
}

const applyConnect = connect(
	( state ) => ( {
		status: getEditedPostAttribute( state, 'status' ),
	} ),
	{
		onUpdateStatus( status ) {
			return editPost( { status } );
		},
	}
);

export default compose(
	applyConnect,
)( PostPendingStatus );
