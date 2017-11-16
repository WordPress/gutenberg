/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { editPost, savePost } from '../../state/actions';
import {
	isEditedPostNew,
	isCurrentPostPublished,
	isEditedPostDirty,
	isSavingPost,
	isEditedPostSaveable,
	getCurrentPost,
	getEditedPostAttribute,
} from '../../state/selectors';

export function PostSavedState( { isNew, isPublished, isDirty, isSaving, isSaveable, status, onStatusChange, onSave } ) {
	const className = 'editor-post-saved-state';

	if ( isSaving ) {
		return (
			<span className={ className }>
				{ __( 'Saving' ) }
			</span>
		);
	}

	if ( ! isSaveable || isPublished ) {
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
		if ( 'auto-draft' === status ) {
			onStatusChange( 'draft' );
		}

		onSave();
	};

	return (
		<Button className={ classnames( className, 'button-link' ) } onClick={ onClick }>
			<span className="editor-post-saved-state__mobile">{ __( 'Save' ) }</span>
			<span className="editor-post-saved-state__desktop">{ __( 'Save Draft' ) }</span>
		</Button>
	);
}

export default connect(
	( state ) => ( {
		post: getCurrentPost( state ),
		isNew: isEditedPostNew( state ),
		isPublished: isCurrentPostPublished( state ),
		isDirty: isEditedPostDirty( state ),
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		status: getEditedPostAttribute( state, 'status' ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
)( PostSavedState );
