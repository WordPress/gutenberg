/**
 * WordPress dependencies
 */
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

const isGutenbergPlugin = globalThis.IS_GUTENBERG_PLUGIN ? true : false;

export function useShouldIframe() {
	const { isBlockBasedTheme, hasV3BlocksOnly, isEditingTemplate } = useSelect(
		( select ) => {
			const { getEditorSettings, getCurrentPostType } =
				select( editorStore );
			const { getBlockTypes } = select( blocksStore );
			const editorSettings = getEditorSettings();
			return {
				isBlockBasedTheme: editorSettings.__unstableIsBlockBasedTheme,
				hasV3BlocksOnly: getBlockTypes().every( ( type ) => {
					return type.apiVersion >= 3;
				} ),
				isEditingTemplate: getCurrentPostType() === 'wp_template',
			};
		},
		[]
	);

	return (
		hasV3BlocksOnly ||
		( isGutenbergPlugin && isBlockBasedTheme ) ||
		isEditingTemplate
	);
}
