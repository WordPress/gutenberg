/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
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
		const doSave = isPublished ||
			! process.env.NODE_ENV === 'production' ||
			window.confirm( __( 'Keep in mind this plugin is a beta version and will not display correctly on your theme.' ) ); // eslint-disable-line no-alert
		if ( doSave ) {
			onStatusChange( publishStatus );
			onSave();
		}
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
		isPublished: isEditedPostPublished( state ),
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
