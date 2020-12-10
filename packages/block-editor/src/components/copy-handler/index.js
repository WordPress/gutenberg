/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import {
	serialize,
	pasteHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	documentHasSelection,
	documentHasUncollapsedSelection,
} from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/get-paste-event-data';

export function useNotifyCopy() {
	const { getBlockName } = useSelect(
		( select ) => select( 'core/block-editor' ),
		[]
	);
	const { getBlockType } = useSelect(
		( select ) => select( blocksStore ),
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

export function useClipboardHandler( ref ) {
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

	useEffect( () => {
		function handler( event ) {
			const selectedBlockClientIds = getSelectedBlockClientIds();

			if ( selectedBlockClientIds.length === 0 ) {
				return;
			}

			// Always handle multiple selected blocks.
			if ( ! hasMultiSelection() ) {
				const { target } = event;
				const { ownerDocument } = target;
				// If copying, only consider actual text selection as selection.
				// Otherwise, any focus on an input field is considered.
				const hasSelection =
					event.type === 'copy' || event.type === 'cut'
						? documentHasUncollapsedSelection( ownerDocument )
						: documentHasSelection( ownerDocument );

				// Let native copy behaviour take over in input fields.
				if ( hasSelection ) {
					return;
				}
			}

			if ( ! ref.current.contains( event.target ) ) {
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
				const {
					__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
				} = getSettings();
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
		}

		ref.current.addEventListener( 'copy', handler );
		ref.current.addEventListener( 'cut', handler );
		ref.current.addEventListener( 'paste', handler );

		return () => {
			ref.current.removeEventListener( 'copy', handler );
			ref.current.removeEventListener( 'cut', handler );
			ref.current.removeEventListener( 'paste', handler );
		};
	}, [] );
}

function CopyHandler( { children } ) {
	const ref = useRef();
	useClipboardHandler( ref );
	return <div ref={ ref }>{ children }</div>;
}

export default CopyHandler;
