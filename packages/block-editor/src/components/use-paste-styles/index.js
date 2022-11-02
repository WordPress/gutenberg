/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { getBlockType, serialize, parse } from '@wordpress/blocks';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

function getStyleAttributes( block ) {
	const blockType = getBlockType( block.name );
	const attributes = {};
	// Mark every attribute that isn't "content" as a style attribute.
	for ( const attribute in block.attributes ) {
		if (
			blockType.attributes[ attribute ].__experimentalRole !== 'content'
		) {
			attributes[ attribute ] = block.attributes[ attribute ];
		}
	}
	return attributes;
}

function recursivelyUpdateBlockAttributes(
	targetBlocks,
	sourceBlocks,
	updateBlockAttributes
) {
	for (
		let index = 0;
		index < Math.min( sourceBlocks.length, targetBlocks.length );
		index += 1
	) {
		updateBlockAttributes(
			targetBlocks[ index ].clientId,
			getStyleAttributes( sourceBlocks[ index ] )
		);

		recursivelyUpdateBlockAttributes(
			targetBlocks[ index ].innerBlocks,
			sourceBlocks[ index ].innerBlocks,
			updateBlockAttributes
		);
	}
}

export default function usePasteStyles() {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createSuccessNotice, createWarningNotice, createErrorNotice } =
		useDispatch( noticesStore );

	return useCallback(
		async ( targetBlocks ) => {
			let html = '';
			try {
				html = await window.navigator.clipboard.readText();
			} catch ( err ) {
				// Possibly the permission is denied.
				createErrorNotice(
					__( 'Permission denied: Unable to read from clipboard.' ),
					{
						type: 'snackbar',
					}
				);
				return;
			}

			const copiedBlocks = parse( html );
			// Abort if the copied text is empty or doesn't look like serialized blocks.
			if ( ! html || serialize( copiedBlocks ) !== html ) {
				createWarningNotice(
					__( "The copied data doesn't appear to be blocks." ),
					{
						type: 'snackbar',
					}
				);
				return;
			}

			if ( copiedBlocks.length === 1 ) {
				// Apply styles of the block to all the target blocks.
				registry.batch( () => {
					recursivelyUpdateBlockAttributes(
						targetBlocks,
						targetBlocks.map( () => copiedBlocks[ 0 ] ),
						updateBlockAttributes
					);
				} );
			} else {
				registry.batch( () => {
					recursivelyUpdateBlockAttributes(
						targetBlocks,
						copiedBlocks,
						updateBlockAttributes
					);
				} );
			}

			if ( targetBlocks.length === 1 ) {
				const title = getBlockType( targetBlocks[ 0 ].name )?.title;
				createSuccessNotice(
					sprintf(
						// Translators: Name of the block being pasted, e.g. "Paragraph".
						__( 'Pasted styles to %s.' ),
						title
					),
					{ type: 'snackbar' }
				);
			} else {
				createSuccessNotice(
					sprintf(
						// Translators: The number of the blocks.
						__( 'Pasted styles to %d blocks.' ),
						targetBlocks.length
					),
					{ type: 'snackbar' }
				);
			}
		},
		[
			registry.batch,
			updateBlockAttributes,
			createSuccessNotice,
			createWarningNotice,
			createErrorNotice,
		]
	);
}
