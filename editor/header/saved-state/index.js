/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Dashicon, Button } from 'components';

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

	if ( isSaving ) {
		return (
			<span className={ className }>
				{ __( 'Saving' ) }
			</span>
		);
	}

	if ( ! isSaveable ) {
		return null;
	}

	if ( ! isNew && ! isDirty ) {
		return (
			<span className={ className }>
				<Dashicon icon="saved" />
				{ __( 'Saved' ) }
			</span>
		);
	}

	const onClick = () => {
		onStatusChange( status || 'draft' );
		onSave();
	};

	return (
		<Button className={ classnames( className, 'button-link' ) } onClick={ onClick }>
			{ __( 'Save' ) }
		</Button>
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
