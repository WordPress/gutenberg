/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from 'components';

/**
 * Internal dependencies
 */
import { editPost, savePost } from '../../actions';
import {
	isSavingPost,
	isEditedPostPublished,
	isEditedPostBeingScheduled,
	getEditedPostVisibility,
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
} ) {
	const buttonEnabled = ! isSaving && isPublishable;
	let buttonText;
	if ( isPublished ) {
		buttonText = wp.i18n.__( 'Update' );
	} else if ( isBeingScheduled ) {
		buttonText = wp.i18n.__( 'Schedule' );
	} else {
		buttonText = wp.i18n.__( 'Publish' );
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

	const buttonDisabledHint = process.env.NODE_ENV === 'production'
		? wp.i18n.__( 'The Save button is disabled during early alpha releases.' )
		: null;

	return (
		<Button
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! buttonEnabled || process.env.NODE_ENV === 'production' }
			title={ buttonDisabledHint }
			className={ className }
		>
			{ buttonText }
		</Button>
	);
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isPublished: isEditedPostPublished( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
		visibility: getEditedPostVisibility( state ),
		isPublishable: isEditedPostPublishable( state ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
)( PublishButton );
