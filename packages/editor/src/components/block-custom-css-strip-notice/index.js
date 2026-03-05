/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Notice shown at the top of the editor when the user lacks unfiltered_html
 * and the content has blocks with custom CSS that will be stripped on save.
 */
export default function BlockCustomCSSStripNotice() {
	const hasBlocksWithCustomCSSThatWillBeStripped = useSelect( ( select ) => {
		const { getClientIdsWithDescendants, getBlock, getSettings } =
			select( blockEditorStore );

		if ( getSettings().__experimentalCanUserUseUnfilteredHTML ) {
			return false;
		}

		const clientIds = getClientIdsWithDescendants();
		return clientIds.some( ( clientId ) => {
			const block = getBlock( clientId );
			return !! block?.attributes?.style?.css?.trim();
		} );
	}, [] );

	if ( ! hasBlocksWithCustomCSSThatWillBeStripped ) {
		return null;
	}

	return (
		<Notice
			className="editor-block-custom-css-strip-notice"
			isDismissible={ false }
			status="warning"
		>
			{ __(
				'Some blocks contain custom CSS that you do not have permission to save. If you update this post, that custom CSS will be removed.'
			) }
		</Notice>
	);
}
