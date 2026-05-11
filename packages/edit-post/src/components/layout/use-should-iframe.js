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
import { unlock } from '../../lock-unlock';

const isGutenbergPlugin = globalThis.IS_GUTENBERG_PLUGIN ? true : false;

export function useShouldIframe() {
	return useSelect( ( select ) => {
		const { getCurrentPostType, getDeviceType } = select( editorStore );
		const { getClientIdsWithDescendants, getBlockName } =
			select( blockEditorStore );
		const { getBlockType } = select( blocksStore );

		return (
			// If the Gutenberg plugin is active, we ALWAYS use the iframe for
			// consistency across the post and site editor. We plan on enforcing
			// the iframe in the future, so Gutenberg both serves as way for us
			// to warn plugin developers and for plugin developers to test their
			// blocks easily. Before GB v22.5, we only enforced it for
			// block-based themes (classic themes used the same rules as core).
			isGutenbergPlugin ||
			// We also still want to iframe all the special
			// editor features and modes such as device previews, zoom out, and
			// template/pattern editing.
			getDeviceType() !== 'Desktop' ||
			[ 'wp_template', 'wp_block' ].includes( getCurrentPostType() ) ||
			unlock( select( blockEditorStore ) ).isZoomOut() ||
			// Finally, still iframe the editor if all present blocks are v3
			// (which means they are marked as iframe-compatible).
			[ ...new Set( getClientIdsWithDescendants().map( getBlockName ) ) ]
				.map( getBlockType )
				.filter( Boolean )
				.every( ( blockType ) => blockType.apiVersion >= 3 )
		);
	}, [] );
}
