import { addAction } from '@wordpress/hooks';
import { select, dispatch, resolveSelect } from '@wordpress/data';
import attachMediaInPost from '../utils/attach-media-in-post';
import { store as editorStore } from '../store';

addAction(
	'editor.savePost',
	'core/editor/attach-media-in-post',
	( { id, type }, options = {} ) => {
		// An autosave or a preview is not the user committing anything, so it is
		// not the moment to start claiming their media.
		if ( options.isAutosave || options.isPreview ) {
			return;
		}

		// Writing to someone's media library on every save deserves an off
		// switch, even without a UI for it. An editor setting is the canonical
		// one: `block_editor_settings_all` in PHP, or `updateEditorSettings` in
		// JS, both reach it without this needing an API of its own.
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
