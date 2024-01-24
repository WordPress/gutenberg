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
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getPasteEventData } from '../../utils/pasting';

export function setClipboardBlocks( event, blocks ) {
	let _blocks = blocks;
	const wrapperBlockName = event.clipboardData.getData(
		'__unstableWrapperBlockName'
	);

	if ( wrapperBlockName ) {
		_blocks = createBlock(
			wrapperBlockName,
			JSON.parse(
				event.clipboardData.getData(
					'__unstableWrapperBlockAttributes'
				)
			),
			_blocks
		);
	}

	const serialized = serialize( _blocks );

	event.clipboardData.setData( 'text/plain', toPlainText( serialized ) );
	event.clipboardData.setData( 'text/html', serialized );
}

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
