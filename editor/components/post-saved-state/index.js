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
import PostSwitchToDraftButton from '../post-switch-to-draft-button';
import { editPost, savePost } from '../../store/actions';
import {
	isEditedPostNew,
	isCurrentPostPublished,
	isEditedPostDirty,
	isSavingPost,
	isEditedPostSaveable,
	getCurrentPost,
	getEditedPostAttribute,
	hasMetaBoxes,
} from '../../store/selectors';

/**
 * Component showing whether the post is saved or not and displaying save links.
 *
 * @param   {Object}    Props Component Props.
 * @return {WPElement}       WordPress Element.
 */
export function PostSavedState( { hasActiveMetaboxes, isNew, isPublished, isDirty, isSaving, isSaveable, status, onStatusChange, onSave } ) {
	const className = 'editor-post-saved-state';

	if ( isSaving ) {
		return (
			<span className={ className }>
				{ __( 'Saving' ) }
			</span>
		);
	}

	if ( isPublished ) {
		return <PostSwitchToDraftButton className={ classnames( className, 'button-link' ) } />;
	}

	if ( ! isSaveable ) {
		return null;
	}

	if ( ! isNew && ! isDirty && ! hasActiveMetaboxes ) {
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
		hasActiveMetaboxes: hasMetaBoxes( state ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
)( PostSavedState );
