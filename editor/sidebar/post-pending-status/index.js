/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, FormToggle, withInstanceId, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getEditedPostAttribute,
	isCurrentPostPublished,
} from '../../selectors';
import { editPost } from '../../actions';

export function PostPendingStatus( { isPublished, instanceId, status, onUpdateStatus, user } ) {
	if ( isPublished || ! user.data || ! user.data.capabilities.publish_posts ) {
		return null;
	}
	const pendingId = 'pending-toggle-' + instanceId;
	const togglePendingStatus = () => {
		const updatedStatus = status === 'pending' ? 'draft' : 'pending';
		onUpdateStatus( updatedStatus );
	};

	return (
		<PanelRow>
			<label htmlFor={ pendingId }>{ __( 'Pending Review' ) }</label>
			<FormToggle
				id={ pendingId }
				checked={ status === 'pending' }
				onChange={ togglePendingStatus }
				showHint={ false }
			/>
		</PanelRow>
	);
}

const applyConnect = connect(
	( state ) => ( {
		status: getEditedPostAttribute( state, 'status' ),
		isPublished: isCurrentPostPublished( state ),
	} ),
	{
		onUpdateStatus( status ) {
			return editPost( { status } );
		},
	}
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight(
	applyConnect,
	applyWithAPIData,
	withInstanceId
)( PostPendingStatus );
