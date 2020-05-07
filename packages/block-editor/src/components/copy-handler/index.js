/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { serialize, pasteHandler } from '@wordpress/blocks';
import { documentHasSelection, documentHasTextSelection } from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/get-paste-event-data';

function CopyHandler( { children } ) {
	const containerRef = useRef();

	const {
		getBlocksByClientId,
		getSelectedBlockClientIds,
		hasMultiSelection,
		getSettings,
	} = useSelect( ( select ) => select( 'core/block-editor' ), [] );

	const { removeBlocks, replaceBlocks } = useDispatch( 'core/block-editor' );
	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const {
		__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
	} = getSettings();

	const handler = ( event ) => {
		const selectedBlockClientIds = getSelectedBlockClientIds();

		if ( selectedBlockClientIds.length === 0 ) {
			return;
		}

		// Always handle multiple selected blocks.
		if ( ! hasMultiSelection() ) {
			// If copying, only consider actual text selection as selection.
			// Otherwise, any focus on an input field is considered.
			const hasSelection =
				event.type === 'copy' || event.type === 'cut'
					? documentHasTextSelection()
					: documentHasSelection();

			// Let native copy behaviour take over in input fields.
			if ( hasSelection ) {
				return;
			}
		}

		if ( ! containerRef.current.contains( event.target ) ) {
			return;
		}
		event.preventDefault();

		if ( event.type === 'copy' || event.type === 'cut' ) {
			createSuccessNotice(
				sprintf(
					// Translators: Number of blocks being copied
					_n(
						'Copied %d block to clipboard',
						'Copied %d blocks to clipboard',
						selectedBlockClientIds.length
					),
					selectedBlockClientIds.length
				),
				{
					type: 'snackbar',
				}
			);
			const blocks = getBlocksByClientId( selectedBlockClientIds );
			const serialized = serialize( blocks );

			event.clipboardData.setData( 'text/plain', serialized );
			event.clipboardData.setData( 'text/html', serialized );
		}

		if ( event.type === 'cut' ) {
			removeBlocks( selectedBlockClientIds );
		} else if ( event.type === 'paste' ) {
			const { plainText, html } = getPasteEventData( event );
			const blocks = pasteHandler( {
				HTML: html,
				plainText,
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} );

			replaceBlocks(
				selectedBlockClientIds,
				blocks,
				blocks.length - 1,
				-1
			);
		}
	};

	return (
		<div
			ref={ containerRef }
			onCopy={ handler }
			onCut={ handler }
			onPaste={ handler }
		>
			{ children }
		</div>
	);
}

export default CopyHandler;
