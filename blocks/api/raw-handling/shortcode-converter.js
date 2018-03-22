/**
 * External dependencies
 */
import { some, castArray, first, mapValues, pickBy } from 'lodash';

/**
 * Internal dependencies
 */
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockType } from '../registration';
import { getBlockAttributes } from '../parser';

/**
 * Browser dependencies
 */
const { shortcode } = window.wp;

function segmentHTMLToShortcodeBlock( HTML ) {
	// Get all matches.
	const transformsFrom = getBlockTransforms( 'from' );

	const transformation = findTransform( transformsFrom, ( transform ) => (
		transform.type === 'shortcode' &&
		some( castArray( transform.tag ), ( tag ) => shortcode.regexp( tag ).test( HTML ) )
	) );

	if ( ! transformation ) {
		return [ HTML ];
	}

	const transformTags = castArray( transformation.tag );
	const transformTag = first( transformTags );

	let match;
	let lastIndex = 0;

	if ( ( match = shortcode.next( transformTag, HTML, lastIndex ) ) ) {
		lastIndex = match.index + match.content.length;

		const attributes = mapValues(
			pickBy( transformation.attributes, ( schema ) => schema.shortcode ),
			// Passing all of `match` as second argument is intentionally broad
			// but shouldn't be too relied upon.
			//
			// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
			( schema ) => schema.shortcode( match.shortcode.attrs, match ),
		);

		const block = createBlock(
			transformation.blockName,
			getBlockAttributes(
				{
					...getBlockType( transformation.blockName ),
					attributes: transformation.attributes,
				},
				match.shortcode.content,
				attributes,
			)
		);

		return [
			HTML.substr( 0, match.index ),
			block,
			...segmentHTMLToShortcodeBlock( HTML.substr( match.index + match.content.length ) ),
		];
	}

	return [ HTML ];
}

export default segmentHTMLToShortcodeBlock;
