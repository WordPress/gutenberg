import { addAction } from '@wordpress/hooks';
import { select, dispatch, resolveSelect } from '@wordpress/data';
import attachMediaInPost from '../utils/attach-media-in-post';
import { store as editorStore } from '../store';

// When a post is saved, auto-attach any media that was added to the post content,
// but not yet attached to the post, matching similar behavior in the classic editor.
addAction(
	'editor.savePost',
	'core/editor/attach-media-in-post',
	( { id, type }, options = {} ) => {
		// An autosave or a preview is not the user committing anything, so it is
		// not the right stage to automatically attach media.
		if ( options.isAutosave || options.isPreview ) {
			return;
		}

		// Allow disabling automatic media attachment through editor settings.
		// While there is no UI for it currently, this allows a plugin to disable it.
		if (
			! select( editorStore ).getEditorSettings().autoAttachMediaEnabled
		) {
			return;
		}

		// Deliberately not returned. `editor.savePost` awaits its handlers, and
		// attaching is bookkeeping — it must never hold up the editor reaching
		// "Saved". Errors are swallowed inside, so nothing can reject here.
		attachMediaInPost( { select, dispatch, resolveSelect }, id, type );
	}
);
