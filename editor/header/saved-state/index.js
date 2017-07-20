/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Dashicon, Button, IconButton } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { editPost, savePost } from '../../actions';
import {
	isEditedPostNew,
	isEditedPostDirty,
	isSavingPost,
	isEditedPostSaveable,
	getCurrentPost,
	getEditedPostAttribute,
} from '../../selectors';

export function SavedState( { isNew, isDirty, isSaving, isSaveable, status, onStatusChange, onSave } ) {
	const className = 'editor-saved-state';
	let buttonLabel = __( 'Save' );
	let isDisabled = false;

	if ( ! isSaveable ) {
		isDisabled = true;
	}

	if ( isSaving ) {
		buttonLabel = __( 'Saving' );
		isDisabled = true;
	}

	if ( ! isNew && ! isDirty ) {
		buttonLabel = __( 'Saved' );
		isDisabled = true;
	}

	const onClick = () => {
		console.log( "clicked" );
		onStatusChange( status || 'draft' );
		onSave();
	};

	return (
		<IconButton
			className={ className }
			onClick={ onClick }
			icon="saved"
			disabled={ isDisabled }
		>
			{ buttonLabel }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		post: getCurrentPost( state ),
		isNew: isEditedPostNew( state ),
		isDirty: isEditedPostDirty( state ),
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		status: getEditedPostAttribute( state, 'status' ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
)( SavedState );
