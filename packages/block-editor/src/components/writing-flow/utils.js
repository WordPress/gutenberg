/**
 * WordPress dependencies
 */
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import {
	serialize,
	createBlock,
	pasteHandler,
	findTransform,
	getBlockTransforms,
	store as blocksStore,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/pasting';
import { store as blockEditorStore } from '../../store';

export const requiresWrapperOnCopy = Symbol( 'requiresWrapperOnCopy' );

/**
 * Sets the clipboard data for the provided blocks, with both HTML and plain
 * text representations.
 *
 * @param {ClipboardEvent} event    Clipboard event.
 * @param {WPBlock[]}      blocks   Blocks to set as clipboard data.
 * @param {Object}         registry The registry to select from.
 */
export function setClipboardBlocks( event, blocks, registry ) {
	let _blocks = blocks;

	const [ firstBlock ] = blocks;

	if ( firstBlock ) {
		const firstBlockType = registry
			.select( blocksStore )
			.getBlockType( firstBlock.name );

		if ( firstBlockType[ requiresWrapperOnCopy ] ) {
			const { getBlockRootClientId, getBlockName, getBlockAttributes } =
				registry.select( blockEditorStore );
			const wrapperBlockClientId = getBlockRootClientId(
				firstBlock.clientId
			);
			const wrapperBlockName = getBlockName( wrapperBlockClientId );

			if ( wrapperBlockName ) {
				_blocks = createBlock(
					wrapperBlockName,
					getBlockAttributes( wrapperBlockClientId ),
					_blocks
				);
			}
		}
	}

	const serialized = serialize( _blocks );

	event.clipboardData.setData( 'text/plain', toPlainText( serialized ) );
	event.clipboardData.setData( 'text/html', serialized );
}

/**
 * Returns the blocks to be pasted from the clipboard event.
 *
 * @param {ClipboardEvent} event                    The clipboard event.
 * @param {boolean}        canUserUseUnfilteredHTML Whether the user can or can't post unfiltered HTML.
 * @return {Array|string} A list of blocks or a string, depending on `handlerMode`.
 */
export function getPasteBlocks( event, canUserUseUnfilteredHTML ) {
	const { plainText, html, files } = getPasteEventData( event );
	let blocks = [];

	if ( files.length ) {
		const fromTransforms = getBlockTransforms( 'from' );
		blocks = files
			.reduce( ( accumulator, file ) => {
				const transformation = findTransform(
					fromTransforms,
					( transform ) =>
						transform.type === 'files' &&
						transform.isMatch( [ file ] )
				);
				if ( transformation ) {
					accumulator.push( transformation.transform( [ file ] ) );
				}
				return accumulator;
			}, [] )
			.flat();
	} else {
		blocks = pasteHandler( {
			HTML: html,
			plainText,
			mode: 'BLOCKS',
			canUserUseUnfilteredHTML,
		} );
	}

	return blocks;
}

/**
 * Given a string of HTML representing serialized blocks, returns the plain
 * text extracted after stripping the HTML of any tags and fixing line breaks.
 *
 * @param {string} html Serialized blocks.
 * @return {string} The plain-text content with any html removed.
 */
function toPlainText( html ) {
	// Manually handle BR tags as line breaks prior to `stripHTML` call
	html = html.replace( /<br>/g, '\n' );

	const plainText = stripHTML( html ).trim();

	// Merge any consecutive line breaks
	return plainText.replace( /\n\n+/g, '\n\n' );
}
