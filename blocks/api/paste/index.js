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
import convertShortcodes from './convert-shortcodes';

export default function( HTML ) {
	return convertShortcodes( HTML ).reduce( ( accu, piece ) => {
		if ( typeof piece !== 'string' ) {
			return [ ...accu, piece ];
		}

		const prepare = flow( [
			stripWrappers,
			normaliseBlocks,
			stripAttributes,
		] );

		const preparedHTML = prepare( piece );

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Processed HTML piece:\n\n', piece );

		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = preparedHTML;

		const blocks = Array.from( doc.body.children ).map( ( node ) => {
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

		return [ ...accu, ...blocks ];
	}, [] );
}
