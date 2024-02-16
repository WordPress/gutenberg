/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';

export function useNotifyCopy() {
	const { getBlockName } = useSelect( blockEditorStore );
	const { getBlockType } = useSelect( blocksStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	return useCallback( ( eventType, selectedBlockClientIds ) => {
		let notice = '';
		if ( selectedBlockClientIds.length === 1 ) {
			const clientId = selectedBlockClientIds[ 0 ];
			const title = getBlockType( getBlockName( clientId ) )?.title;
			notice =
				eventType === 'copy'
					? sprintf(
							// Translators: Name of the block being copied, e.g. "Paragraph".
							__( 'Copied "%s" to clipboard.' ),
							title
					  )
					: sprintf(
							// Translators: Name of the block being cut, e.g. "Paragraph".
							__( 'Moved "%s" to clipboard.' ),
							title
					  );
		} else {
			notice =
				eventType === 'copy'
					? sprintf(
							// Translators: %d: Number of blocks being copied.
							_n(
								'Copied %d block to clipboard.',
								'Copied %d blocks to clipboard.',
								selectedBlockClientIds.length
							),
							selectedBlockClientIds.length
					  )
					: sprintf(
							// Translators: %d: Number of blocks being cut.
							_n(
								'Moved %d block to clipboard.',
								'Moved %d blocks to clipboard.',
								selectedBlockClientIds.length
							),
							selectedBlockClientIds.length
					  );
		}
		createSuccessNotice( notice, {
			type: 'snackbar',
		} );
	}, [] );
}
