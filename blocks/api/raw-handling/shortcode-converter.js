/**
 * External dependencies
 */
import { castArray, find, get, dropRight, last, mapValues, pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock } from '../factory';
import { getBlockTypes } from '../registration';
import { getBlockAttributes } from '../parser';

/**
 * Browser dependencies
 */
const { shortcode } = window.wp;

export default function( HTML ) {
	// Get all matches. These are *not* ordered.
	const matches = getBlockTypes().reduce( ( acc, blockType ) => {
		const transformsFrom = get( blockType, 'transforms.from', [] );
		const transform = find( transformsFrom, ( { type } ) => type === 'shortcode' );

		if ( ! transform ) {
			return acc;
		}

		const transformTags = castArray( transform.tag );

		let match;
		let lastIndex = 0;

		for ( const transformTag of transformTags ) {
			while ( ( match = shortcode.next( transformTag, HTML, lastIndex ) ) ) {
				lastIndex = match.index + match.content.length;

				const attributes = mapValues(
					pickBy( transform.attributes, ( schema ) => schema.shortcode ),
					// Passing all of `match` as second argument is intentionally
					// broad but shouldn't be too relied upon. See
					// https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
					( schema ) => schema.shortcode( match.shortcode.attrs, match ),
				);

				const block = createBlock(
					blockType.name,
					getBlockAttributes(
						{
							...blockType,
							attributes: transform.attributes,
						},
						match.shortcode.content,
						attributes,
					)
				);

				acc[ match.index ] = { block, lastIndex };
			}
		}

		return acc;
	}, {} );

	let negativeI = 0;

	// Sort the matches and return an array of text pieces and blocks.
	return Object.keys( matches ).sort( ( a, b ) => a - b ).reduce( ( acc, index ) => {
		const match = matches[ index ];

		acc = [
			// Add all pieces except the last text piece.
			...dropRight( acc ),
			// Add the start of the last text piece.
			last( acc ).slice( 0, index - negativeI ),
			// Add the block.
			match.block,
			// Add the rest of the last text piece.
			last( acc ).slice( match.lastIndex - negativeI ),
		];

		negativeI = match.lastIndex;

		return acc;
	}, [ HTML ] );
}
