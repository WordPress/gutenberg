/**
 * WordPress dependencies
 */
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

const isGutenbergPlugin = globalThis.IS_GUTENBERG_PLUGIN ? true : false;

export function useShouldIframe() {
	const {
		isBlockBasedTheme,
		hasV3BlocksOnly,
		isEditingTemplate,
		hasMetaBoxes,
		isZoomOutMode,
	} = useSelect( ( select ) => {
		const { getEditorSettings, getCurrentPostType } = select( editorStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { getBlockTypes } = select( blocksStore );
		const editorSettings = getEditorSettings();
		return {
			isBlockBasedTheme: editorSettings.__unstableIsBlockBasedTheme,
			hasV3BlocksOnly: getBlockTypes().every( ( type ) => {
				return type.apiVersion >= 3;
			} ),
			isEditingTemplate: getCurrentPostType() === 'wp_template',
			hasMetaBoxes: select( editPostStore ).hasMetaBoxes(),
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );

	return (
		( ( hasV3BlocksOnly || ( isGutenbergPlugin && isBlockBasedTheme ) ) &&
			! hasMetaBoxes ) ||
		isEditingTemplate ||
		isZoomOutMode
	);
}
