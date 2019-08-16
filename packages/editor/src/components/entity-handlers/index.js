/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { EntityProvider, InnerBlocks } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EditorProvider from '../provider';
import PostSavedState from '../post-saved-state';

export const entityProviderValue = {
	useCurrentEntityAttribute( attribute ) {
		return useSelect(
			( select ) => select( 'core/editor' ).getCurrentEntityAttribute( attribute ),
			[]
		);
	},
	useEditedEntityAttribute( attribute ) {
		return useSelect(
			( select ) => select( 'core/editor' ).getEditedEntityAttribute( attribute ),
			[]
		);
	},
	useEditEntity() {
		return useDispatch()( 'core/editor' ).editEntity;
	},
};

export default function EntityHandlers( {
	entity,
	handles = { all: true },
	children,
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
		<EntityProvider value={ entityProviderValue }>
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
				{ children }
			</EditorProvider>
		</EntityProvider>
	);
}

// Expose this so that saving content to the
// top level registry's entity is more semantic.
EntityHandlers.Content = InnerBlocks.Content;
