/**
 * External dependencies
 */
import { some, castArray, find, mapValues, pickBy, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { regexp, next } from '@wordpress/shortcode';

/**
 * Internal dependencies
 */
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockType } from '../registration';
import { getBlockAttributes } from '../parser';

function segmentHTMLToShortcodeBlock(
	HTML,
	lastIndex = 0,
	excludedBlockNames = []
) {
	// Get all matches.
	const transformsFrom = getBlockTransforms( 'from' );

	const transformation = findTransform(
		transformsFrom,
		( transform ) =>
			excludedBlockNames.indexOf( transform.blockName ) === -1 &&
			transform.type === 'shortcode' &&
			some( castArray( transform.tag ), ( tag ) =>
				regexp( tag ).test( HTML )
			)
	);

	if ( ! transformation ) {
		return [ HTML ];
	}

	const transformTags = castArray( transformation.tag );
	const transformTag = find( transformTags, ( tag ) =>
		regexp( tag ).test( HTML )
	);

	let match;
	const previousIndex = lastIndex;

	if ( ( match = next( transformTag, HTML, lastIndex ) ) ) {
		lastIndex = match.index + match.content.length;
		const beforeHTML = HTML.substr( 0, match.index );
		const afterHTML = HTML.substr( lastIndex );

		// If the shortcode content does not contain HTML and the shortcode is
		// not on a new line (or in paragraph from Markdown converter),
		// consider the shortcode as inline text, and thus skip conversion for
		// this segment.
		if (
			! includes( match.shortcode.content || '', '<' ) &&
			! (
				/(\n|<p>)\s*$/.test( beforeHTML ) &&
				/^\s*(\n|<\/p>)/.test( afterHTML )
			)
		) {
			return segmentHTMLToShortcodeBlock( HTML, lastIndex );
		}

		// If a transformation's `isMatch` predicate fails for the inbound
		// shortcode, try again by excluding the current block type.
		//
		// This is the only call to `segmentHTMLToShortcodeBlock` that should
		// ever carry over `excludedBlockNames`. Other calls in the module
		// should skip that argument as a way to reset the exclusion state, so
		// that one `isMatch` fail in an HTML fragment doesn't prevent any
		// valid matches in subsequent fragments.
		if (
			transformation.isMatch &&
			! transformation.isMatch( match.shortcode.attrs )
		) {
			return segmentHTMLToShortcodeBlock( HTML, previousIndex, [
				...excludedBlockNames,
				transformation.blockName,
			] );
		}

		const attributes = mapValues(
			pickBy( transformation.attributes, ( schema ) => schema.shortcode ),
			// Passing all of `match` as second argument is intentionally broad
			// but shouldn't be too relied upon.
			//
			// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
			( schema ) => schema.shortcode( match.shortcode.attrs, match )
		);

		const block = createBlock(
			transformation.blockName,
			getBlockAttributes(
				{
					...getBlockType( transformation.blockName ),
					attributes: transformation.attributes,
				},
				match.shortcode.content,
				attributes
			)
		);

		return [
			beforeHTML,
			block,
			...segmentHTMLToShortcodeBlock( HTML.substr( lastIndex ) ),
		];
	}

	return [ HTML ];
}

export default segmentHTMLToShortcodeBlock;
