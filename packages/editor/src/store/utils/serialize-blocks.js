/**
 * External dependencies
 */
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import {
	isUnmodifiedDefaultBlock,
	serialize,
	getFreeformContentHandlerName,
} from '@wordpress/blocks';
import { removep } from '@wordpress/autop';

/**
 * Serializes blocks following backwards compatibility conventions.
 *
 * @param {Array} blocksForSerialization The blocks to serialize.
 *
 * @return {string} The blocks serialization.
 */
const serializeBlocks = memoize(
	( blocksForSerialization ) => {
		// A single unmodified default block is assumed to
		// be equivalent to an empty post.
		if (
			blocksForSerialization.length === 1 &&
			isUnmodifiedDefaultBlock( blocksForSerialization[ 0 ] )
		) {
			blocksForSerialization = [];
		}

		let content = serialize( blocksForSerialization );

		// For compatibility, treat a post consisting of a
		// single freeform block as legacy content and apply
		// pre-block-editor removep'd content formatting.
		if (
			blocksForSerialization.length === 1 &&
			blocksForSerialization[ 0 ].name === getFreeformContentHandlerName()
		) {
			content = removep( content );
		}

		return content;
	},
	{ maxSize: 1 }
);

export default serializeBlocks;
