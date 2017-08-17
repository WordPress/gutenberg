/**
 * External dependencies
 */
import { find, get, flowRight as compose } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes, getUnknownTypeHandlerName } from '../registration';
import { getBlockAttributes } from '../parser';
import normaliseBlocks from './normalise-blocks';
import stripAttributes from './strip-attributes';
import stripWrappers from './strip-wrappers';

export default function( nodes ) {
	const prepare = compose( [
		stripWrappers,
		normaliseBlocks,
		stripAttributes,
	] );

	return prepare( nodes ).map( ( node ) => {
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
