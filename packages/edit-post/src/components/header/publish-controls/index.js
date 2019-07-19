/**
 * WordPress dependencies
 */
import {
	withSelect,
} from '@wordpress/data';
import {
	PostPreviewButton,
	PostSavedState,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostPublishButtonOrToggle from './post-publish-button-or-toggle';

const PublishControls = ( { hasActiveMetaboxes, isPublishSidebarOpened, isSaving } ) => {
	return (
		<>
			{ ! isPublishSidebarOpened && (
				// This button isn't completely hidden by the publish sidebar.
				// We can't hide the whole toolbar when the publish sidebar is open because
				// we want to prevent mounting/unmounting the PostPublishButtonOrToggle DOM node.
				// We track that DOM node to return focus to the PostPublishButtonOrToggle
				// when the publish sidebar has been closed.
				<PostSavedState
					forceIsDirty={ hasActiveMetaboxes }
					forceIsSaving={ isSaving }
				/>
			) }
			<PostPreviewButton
				forceIsAutosaveable={ hasActiveMetaboxes }
				forcePreviewLink={ isSaving ? null : undefined }
			/>
			<PostPublishButtonOrToggle
				forceIsDirty={ hasActiveMetaboxes }
				forceIsSaving={ isSaving }
			/>
		</>
	);
};

export default withSelect( ( select ) => ( {
	hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
	isPublishSidebarOpened: select( 'core/edit-post' ).isPublishSidebarOpened(),
	isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
} ) )( PublishControls );

