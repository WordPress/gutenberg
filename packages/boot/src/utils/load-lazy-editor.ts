import loadAssets from '@wordpress/asset-loader';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../lock-unlock';

type LazyEditorModule = typeof import( '@wordpress/lazy-editor' );

let lazyEditorPromise: Promise< LazyEditorModule > | undefined;

/**
 * Loads `@wordpress/lazy-editor` and the editor scripts it needs.
 *
 * Boot does not load `@wordpress/editor` and the scripts that come with it up
 * front, so that screens without an editor, like Connectors, stay light. The
 * lazy editor reads those scripts from `window.wp` as soon as it is evaluated,
 * so they are loaded first, from the editor assets endpoint.
 *
 * @return The lazy editor module.
 */
export default function loadLazyEditor(): Promise< LazyEditorModule > {
	if ( ! lazyEditorPromise ) {
		lazyEditorPromise = ( async () => {
			const editorAssets = await unlock(
				resolveSelect( coreStore )
			).getEditorAssets();
			await loadAssets(
				editorAssets.scripts || {},
				editorAssets.inline_scripts || { before: {}, after: {} },
				editorAssets.styles || {},
				editorAssets.inline_styles || { before: {}, after: {} },
				editorAssets.html_templates || [],
				editorAssets.script_modules || {}
			);
			return import( '@wordpress/lazy-editor' );
		} )();
		// Let a later call try again if this one failed.
		lazyEditorPromise.catch( () => {
			lazyEditorPromise = undefined;
		} );
	}
	return lazyEditorPromise;
}
