/**
 * Internal dependencies
 */
import { createBlock, findTransform } from '../factory';
import { getBlockAttributes } from '../parser';
import { getRawTransforms } from './get-raw-transforms';

/**
 * Converts HTML directly to blocks. Looks for a matching transform for each
 * top-level tag. The HTML should be filtered to not have any text between
 * top-level tags and formatted in a way that blocks can handle the HTML.
 *
 * @param {string} html HTML to convert.
 *
 * @return {Array} An array of blocks.
 */
export function htmlToBlocks( html ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).flatMap( ( node ) => {
		const rawTransform = findTransform(
			getRawTransforms(),
			( { isMatch } ) => isMatch( node )
		);

		if ( ! rawTransform ) {
			return createBlock(
				// Should not be hardcoded.
				'core/html',
				getBlockAttributes( 'core/html', node.outerHTML )
			);
		}

		const { transform, blockName } = rawTransform;

		if ( transform ) {
			return transform( node );
		}

		return createBlock(
			blockName,
			getBlockAttributes( blockName, node.outerHTML )
		);
	} );
}
