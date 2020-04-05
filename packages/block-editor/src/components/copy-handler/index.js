/**
 * WordPress dependencies
 */
import { serialize, pasteHandler } from '@wordpress/blocks';
import { documentHasSelection } from '@wordpress/dom';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/get-paste-event-data';

function CopyHandler( { children, handler } ) {
	return (
		<div onCopy={ handler } onCut={ handler } onPaste={ handler }>
			{ children }
		</div>
	);
}

export default compose( [
	withDispatch( ( dispatch, ownProps, { select } ) => {
		const {
			getBlocksByClientId,
			getSelectedBlockClientIds,
			hasMultiSelection,
			getSettings,
		} = select( 'core/block-editor' );
		const { removeBlocks, replaceBlocks } = dispatch( 'core/block-editor' );
		const {
			__experimentalCanUserUseUnfilteredHTML: canUserUseUnfilteredHTML,
		} = getSettings();

		return {
			handler( event ) {
				const selectedBlockClientIds = getSelectedBlockClientIds();

				if ( selectedBlockClientIds.length === 0 ) {
					return;
				}

				// Always handle multiple selected blocks.
				// Let native copy behaviour take over in input fields.
				if ( ! hasMultiSelection() && documentHasSelection() ) {
					return;
				}

				event.preventDefault();

				if ( event.type === 'copy' || event.type === 'cut' ) {
					const blocks = getBlocksByClientId(
						selectedBlockClientIds
					);
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

					replaceBlocks( selectedBlockClientIds, blocks );
				}
			},
		};
	} ),
] )( CopyHandler );
