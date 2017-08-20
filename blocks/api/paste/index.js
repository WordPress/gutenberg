/**
 * External dependencies
 */
import { find, get, flow } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes, getUnknownTypeHandlerName } from '../registration';
import { getBlockAttributes } from '../parser';
import normaliseBlocks from './normalise-blocks';
import stripAttributes from './strip-attributes';
import stripWrappers from './strip-wrappers';

export default function( HTML ) {
	const prepare = flow( [
		stripWrappers,
		normaliseBlocks,
		stripAttributes,
	] );

	const preparedHTML = prepare( HTML );

	// Allows us to ask for this information when we get a report.
	window.console.log( 'Processed HTML piece:\n\n', HTML );

	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = preparedHTML;

	return Array.from( doc.body.children ).map( ( node ) => {
		const block = getBlockTypes().reduce( ( acc, blockType ) => {
			if ( acc ) {
				return acc;
			}

			const transformsFrom = get( blockType, 'transforms.from', [] );
			const transform = find( transformsFrom, ( { type } ) => type === 'raw' );

			if ( ! transform || ! transform.isMatch( node ) ) {
				return acc;
			}

			return createBlock(
				blockType.name,
				getBlockAttributes(
					blockType,
					node.outerHTML
				)
			);
		}, null );

		if ( block ) {
			return block;
		}

		return createBlock( getUnknownTypeHandlerName(), {
			content: node.outerHTML,
		} );
	} );
}
