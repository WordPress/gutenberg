/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { store as blocksStore } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Returns a callback that confirms a paste with a snackbar notice, the
 * counterpart to the notice shown on copy and cut.
 *
 * Only whole-block pastes are announced. Pasting inline content into a rich
 * text field stays silent, mirroring copy: a partial text selection is left to
 * the browser and produces no notice either.
 *
 * @return {Function} Callback accepting the blocks that were pasted.
 */
export function useNotifyPaste() {
	const { getBlockType } = useSelect( blocksStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	return useCallback(
		( blocks ) => {
			if ( ! blocks?.length ) {
				return;
			}

			// Unregistered blocks have no title to name, so those fall back to
			// the count.
			const title =
				blocks.length === 1
					? getBlockType( blocks[ 0 ].name )?.title
					: undefined;

			const notice = title
				? sprintf(
						// Translators: %s: Name of the block being pasted, e.g. "Paragraph".
						__( 'Pasted "%s" to clipboard.' ),
						title
				  )
				: sprintf(
						// Translators: %d: Number of blocks being pasted.
						_n(
							'Pasted %d block.',
							'Pasted %d blocks.',
							blocks.length
						),
						blocks.length
				  );

			createSuccessNotice( notice, {
				type: 'snackbar',
			} );
		},
		[ createSuccessNotice, getBlockType ]
	);
}
