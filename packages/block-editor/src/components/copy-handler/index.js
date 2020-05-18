/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { serialize, pasteHandler } from '@wordpress/blocks';
import { documentHasSelection, documentHasTextSelection } from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/get-paste-event-data';

function useNotifyCopy() {
	const { getBlockName } = useSelect(
		( select ) => select( 'core/block-editor' ),
		[]
	);
	const { getBlockType } = useSelect(
		( select ) => select( 'core/blocks' ),
		[]
	);
	const { createSuccessNotice } = useDispatch( 'core/notices' );

	return useCallback( ( eventType, selectedBlockClientIds ) => {
		let notice = '';
		if ( selectedBlockClientIds.length === 1 ) {
			const clientId = selectedBlockClientIds[ 0 ];
			const { title } = getBlockType( getBlockName( clientId ) );
			notice =
				eventType === 'copy'
					? sprintf(
							// Translators: Name of the block being copied, e.g. "Paragraph"
							__( 'Copied "%s" to clipboard.' ),
							title
					  )
					: sprintf(
							// Translators: Name of the block being cut, e.g. "Paragraph"
							__( 'Moved "%s" to clipboard.' ),
							title
					  );
		} else {
			notice =
				eventType === 'copy'
					? sprintf(
							// Translators: Number of blocks being copied
							__( 'Copied %d blocks to clipboard.' ),
							selectedBlockClientIds.length
					  )
					: sprintf(
							// Translators: Number of blocks being cut
							__( 'Moved %d blocks to clipboard.' ),
							selectedBlockClientIds.length
					  );
		}
		createSuccessNotice( notice, {
			type: 'snackbar',
		} );
	}, [] );
}

function CopyHandler( { children } ) {
	const containerRef = useRef();

	const {
		getBlocksByClientId,
		getSelectedBlockClientIds,
		hasMultiSelection,
		getSettings,
	} = useSelect( ( select ) => select( 'core/block-editor' ), [] );

	const { flashBlock, removeBlocks, replaceBlocks } = useDispatch(
		'core/block-editor'
	);

	const notifyCopy = useNotifyCopy();

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
			if ( selectedBlockClientIds.length === 1 ) {
				flashBlock( selectedBlockClientIds[ 0 ] );
			}
			notifyCopy( event.type, selectedBlockClientIds );
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
