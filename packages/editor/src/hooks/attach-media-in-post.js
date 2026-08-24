import { addAction } from '@wordpress/hooks';
import { select, dispatch, resolveSelect } from '@wordpress/data';
import attachMediaInPost from '../utils/attach-media-in-post';

addAction(
	'editor.savePost',
	'core/editor/attach-media-in-post',
	( { id, type }, options = {} ) => {
		// An autosave or a preview is not the user committing anything, so it is
		// not the moment to start claiming their media.
		if ( options.isAutosave || options.isPreview ) {
			return;
		}

		// Deliberately not returned. `editor.savePost` awaits its handlers, and
		// attaching is bookkeeping — it must never hold up the editor reaching
		// "Saved". Errors are swallowed inside, so nothing can reject here.
		attachMediaInPost( { select, dispatch, resolveSelect }, id, type );
	}
);
