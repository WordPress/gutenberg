/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import EditorProvider from '../provider';
import PostSavedState from '../post-saved-state';

export default function EntityHandlers( {
	entity,
	handles = { all: true },
	...props
} ) {
	const editorSettings = useSelect(
		( select ) => select( 'core/editor' ).getEditorSettings(),
		[]
	);
	const parentDispatch = useDispatch();

	// Using the provider like this will create a separate registry
	// and store for the `entity`, while still syncing child blocks
	// to the top level registry as inner blocks to maintain a
	// seamless editing experience.
	return (
		<EditorProvider
			noBlockEditorStore
			settings={ useMemo(
				() => ( { ...editorSettings, handles, parentDispatch } ),
				[ editorSettings, parentDispatch ]
			) }
			post={ entity }
			{ ...props }
		>
			<PostSavedState />
		</EditorProvider>
	);
}

// Expose this so that saving content to the
// top level registry's entity is more semantic.
EntityHandlers.Content = InnerBlocks.Content;
