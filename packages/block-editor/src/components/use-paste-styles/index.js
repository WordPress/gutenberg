/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { getBlockType, parse } from '@wordpress/blocks';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	hasAlignSupport,
	hasBorderSupport,
	hasBackgroundColorSupport,
	hasTextAlignSupport,
	hasTextColorSupport,
	hasGradientSupport,
	hasCustomClassNameSupport,
	hasFontFamilySupport,
	hasFontSizeSupport,
	hasLayoutSupport,
	hasStyleSupport,
} from '../../hooks/supports';

/**
 * Determine if the copied text looks like serialized blocks or not.
 * Since plain text will always get parsed into a freeform block,
 * we check that if the parsed blocks is anything other than that.
 *
 * @param {string} text The copied text.
 * @return {boolean} True if the text looks like serialized blocks, false otherwise.
 */
function hasSerializedBlocks( text ) {
	try {
		const blocks = parse( text, {
			__unstableSkipMigrationLogs: true,
			__unstableSkipAutop: true,
		} );
		if ( blocks.length === 1 && blocks[ 0 ].name === 'core/freeform' ) {
			// It's likely that the text is just plain text and not serialized blocks.
			return false;
		}
		return true;
	} catch ( err ) {
		// Parsing error, the text is not serialized blocks.
		// (Even though that it technically won't happen)
		return false;
	}
}

/**
 * Style attributes are attributes being added in `block-editor/src/hooks/*`.
 * (Except for some unrelated to style like `anchor` or `settings`.)
 * They generally represent the default block supports.
 */
const STYLE_ATTRIBUTES = {
	align: hasAlignSupport,
	borderColor: ( nameOrType ) => hasBorderSupport( nameOrType, 'color' ),
	backgroundColor: hasBackgroundColorSupport,
	textAlign: hasTextAlignSupport,
	textColor: hasTextColorSupport,
	gradient: hasGradientSupport,
	className: hasCustomClassNameSupport,
	fontFamily: hasFontFamilySupport,
	fontSize: hasFontSizeSupport,
	layout: hasLayoutSupport,
	style: hasStyleSupport,
};

/**
 * Get the "style attributes" from a given block to a target block.
 *
 * @param {WPBlock} sourceBlock The source block.
 * @param {WPBlock} targetBlock The target block.
 * @return {Object} the filtered attributes object.
 */
function getStyleAttributes( sourceBlock, targetBlock ) {
	return Object.entries( STYLE_ATTRIBUTES ).reduce(
		( attributes, [ attributeKey, hasSupport ] ) => {
			// Only apply the attribute if both blocks support it.
			if (
				hasSupport( sourceBlock.name ) &&
				hasSupport( targetBlock.name )
			) {
				// Override attributes that are not present in the block to their defaults.
				attributes[ attributeKey ] =
					sourceBlock.attributes[ attributeKey ];
			}
			return attributes;
		},
		{}
	);
}

/**
 * Update the target blocks with style attributes recursively.
 *
 * @param {WPBlock[]} targetBlocks          The target blocks to be updated.
 * @param {WPBlock[]} sourceBlocks          The source blocks to get th style attributes from.
 * @param {Function}  updateBlockAttributes The function to update the attributes.
 */
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
			getStyleAttributes( sourceBlocks[ index ], targetBlocks[ index ] )
		);

		recursivelyUpdateBlockAttributes(
			targetBlocks[ index ].innerBlocks,
			sourceBlocks[ index ].innerBlocks,
			updateBlockAttributes
		);
	}
}

/**
 * A hook to return a pasteStyles event function for handling pasting styles to blocks.
 *
 * @return {Function} A function to update the styles to the blocks.
 */
export default function usePasteStyles() {
	const registry = useRegistry();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createSuccessNotice, createWarningNotice, createErrorNotice } =
		useDispatch( noticesStore );

	return useCallback(
		async ( targetBlocks ) => {
			let html = '';
			try {
				// `http:` sites won't have the clipboard property on navigator.
				// (with the exception of localhost.)
				if ( ! window.navigator.clipboard ) {
					createErrorNotice(
						__(
							'Unable to paste styles. This feature is only available on secure (https) sites in supporting browsers.'
						),
						{ type: 'snackbar' }
					);
					return;
				}

				html = await window.navigator.clipboard.readText();
			} catch ( error ) {
				// Possibly the permission is denied.
				createErrorNotice(
					__(
						'Unable to paste styles. Please allow browser clipboard permissions before continuing.'
					),
					{
						type: 'snackbar',
					}
				);
				return;
			}

			// Abort if the copied text is empty or doesn't look like serialized blocks.
			if ( ! html || ! hasSerializedBlocks( html ) ) {
				createWarningNotice(
					__(
						"Unable to paste styles. Block styles couldn't be found within the copied content."
					),
					{
						type: 'snackbar',
					}
				);
				return;
			}

			const copiedBlocks = parse( html );

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
