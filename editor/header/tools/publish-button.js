/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { editPost, savePost } from '../../actions';
import {
	isSavingPost,
	isCurrentPostPublished,
	isEditedPostBeingScheduled,
	getEditedPostVisibility,
	isEditedPostSaveable,
	isEditedPostPublishable,
} from '../../selectors';

function PublishButton( {
	isSaving,
	isPublished,
	onStatusChange,
	onSave,
	isBeingScheduled,
	visibility,
	isPublishable,
	isSaveable,
} ) {
	const buttonEnabled = ! isSaving && isPublishable && isSaveable;
	let buttonText;
	if ( isPublished ) {
		buttonText = __( 'Update' );
	} else if ( isBeingScheduled ) {
		buttonText = __( 'Schedule' );
	} else {
		buttonText = __( 'Publish' );
	}
	let publishStatus = 'publish';
	if ( isBeingScheduled ) {
		publishStatus = 'future';
	} else if ( visibility === 'private' ) {
		publishStatus = 'private';
	}
	const className = classnames( 'editor-tools__publish-button', { 'is-saving': isSaving } );
	const onClick = () => {
		onStatusChange( publishStatus );
		onSave();
	};

	return (
		<Button
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! buttonEnabled }
			className={ className }
		>
			{ buttonText }
		</Button>
	);
}

export default connect(
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
)( PublishButton );
