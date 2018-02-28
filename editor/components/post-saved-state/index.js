/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostSwitchToDraftButton from '../post-switch-to-draft-button';
import { savePost } from '../../store/actions';
import {
	isEditedPostNew,
	isCurrentPostPublished,
	isEditedPostDirty,
	isSavingPost,
	isEditedPostSaveable,
	getCurrentPost,
} from '../../store/selectors';

/**
 * Component showing whether the post is saved or not and displaying save links.
 *
 * @param   {Object}    Props Component Props.
 * @return {WPElement}       WordPress Element.
 */
export function PostSavedState( { isNew, isPublished, isDirty, isSaving, isSaveable, onSave } ) {
	const className = 'editor-post-saved-state';

	if ( isSaving ) {
		return (
			<span className={ className }>
				{ __( 'Saving' ) }
			</span>
		);
	}

	if ( isPublished ) {
		return <PostSwitchToDraftButton />;
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

	return (
		<IconButton
			className="editor-post-save-draft"
			onClick={ onSave }
			icon="cloud-upload"
			label={ __( 'Save Draft' ) }
		>
			<span className="editor-post-saved-state__mobile">{ __( 'Save' ) }</span>
			<span className="editor-post-saved-state__desktop">{ __( 'Save Draft' ) }</span>
		</IconButton>
	);
}

export default connect(
	( state, { forceIsDirty, forceIsSaving } ) => ( {
		post: getCurrentPost( state ),
		isNew: isEditedPostNew( state ),
		isPublished: isCurrentPostPublished( state ),
		isDirty: forceIsDirty || isEditedPostDirty( state ),
		isSaving: forceIsSaving || isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
	} ),
	{
		onSave: savePost,
	}
)( PostSavedState );
