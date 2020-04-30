/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { serialize, pasteHandler } from '@wordpress/blocks';
import { documentHasSelection } from '@wordpress/dom';
import { useDispatch, useSelect } from '@wordpress/data';

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

	const {
		__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
	} = getSettings();

	const handler = ( event ) => {
		const selectedBlockClientIds = getSelectedBlockClientIds();

		if ( selectedBlockClientIds.length === 0 ) {
			return;
		}

		// Always handle multiple selected blocks.
		// Let native copy behaviour take over in input fields.
		if ( ! hasMultiSelection() && documentHasSelection() ) {
			return;
		}

		if ( ! containerRef.current.contains( event.target ) ) {
			return;
		}
		event.preventDefault();

		if ( event.type === 'copy' || event.type === 'cut' ) {
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
