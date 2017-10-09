/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { editPost, savePost } from '../../actions';
import {
	isSavingPost,
	isCurrentPostPublished,
	isEditedPostBeingScheduled,
	getEditedPostVisibility,
	isEditedPostSaveable,
	isEditedPostPublishable,
} from '../../selectors';

export function PublishButton( {
	isSaving,
	isPublished,
	onStatusChange,
	onSave,
	isBeingScheduled,
	visibility,
	isPublishable,
	isSaveable,
	user,
} ) {
	const isButtonEnabled = user.data && ! isSaving && isPublishable && isSaveable;
	const isContributor = user.data && ! user.data.capabilities.publish_posts;

	let buttonText;
	if ( isContributor ) {
		buttonText = __( 'Submit for Review' );
	} else if ( isPublished ) {
		buttonText = __( 'Update' );
	} else if ( isBeingScheduled ) {
		buttonText = __( 'Schedule' );
	} else {
		buttonText = __( 'Publish' );
	}

	let publishStatus;
	if ( isContributor ) {
		publishStatus = 'pending';
	} else if ( isBeingScheduled ) {
		publishStatus = 'future';
	} else if ( visibility === 'private' ) {
		publishStatus = 'private';
	} else {
		publishStatus = 'publish';
	}

	const className = classnames( 'editor-publish-button', {
		'is-saving': isSaving,
	} );

	const onClick = () => {
		onStatusChange( publishStatus );
		onSave();
	};

	return (
		<Button
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! isButtonEnabled }
			className={ className }
		>
			{ buttonText }
		</Button>
	);
}

const applyConnect = connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isPublished: isCurrentPostPublished( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
		visibility: getEditedPostVisibility( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
] )( PublishButton );
