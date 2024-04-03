/**
 * WordPress dependencies
 */
import { regexp, next } from '@wordpress/shortcode';

/**
 * Internal dependencies
 */
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockType } from '../registration';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { applyBuiltInValidationFixes } from '../parser/apply-built-in-validation-fixes';

const castArray = ( maybeArray ) =>
	Array.isArray( maybeArray ) ? maybeArray : [ maybeArray ];

const beforeLineRegexp = /(\n|<p>)\s*$/;
const afterLineRegexp = /^\s*(\n|<\/p>)/;

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
			castArray( transform.tag ).some( ( tag ) =>
				regexp( tag ).test( HTML )
			)
	);

	if ( ! transformation ) {
		return [ HTML ];
	}

	const transformTags = castArray( transformation.tag );
	const transformTag = transformTags.find( ( tag ) =>
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
			! match.shortcode.content?.includes( '<' ) &&
			! (
				beforeLineRegexp.test( beforeHTML ) &&
				afterLineRegexp.test( afterHTML )
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

		let blocks = [];
		if ( typeof transformation.transform === 'function' ) {
			// Passing all of `match` as second argument is intentionally broad
			// but shouldn't be too relied upon.
			//
			// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
			blocks = [].concat(
				transformation.transform( match.shortcode.attrs, match )
			);

			// Applying the built-in fixes can enhance the attributes with missing content like "className".
			blocks = blocks.map( ( block ) => {
				block.originalContent = match.shortcode.content;
				return applyBuiltInValidationFixes(
					block,
					getBlockType( block.name )
				);
			} );
		} else {
			const attributes = Object.fromEntries(
				Object.entries( transformation.attributes )
					.filter( ( [ , schema ] ) => schema.shortcode )
					// Passing all of `match` as second argument is intentionally broad
					// but shouldn't be too relied upon.
					//
					// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
					.map( ( [ key, schema ] ) => [
						key,
						schema.shortcode( match.shortcode.attrs, match ),
					] )
			);

			const blockType = getBlockType( transformation.blockName );
			if ( ! blockType ) {
				return [ HTML ];
			}

			const transformationBlockType = {
				...blockType,
				attributes: transformation.attributes,
			};

			let block = createBlock(
				transformation.blockName,
				getBlockAttributes(
					transformationBlockType,
					match.shortcode.content,
					attributes
				)
			);

			// Applying the built-in fixes can enhance the attributes with missing content like "className".
			block.originalContent = match.shortcode.content;
			block = applyBuiltInValidationFixes(
				block,
				transformationBlockType
			);

			blocks = [ block ];
		}

		return [
			...segmentHTMLToShortcodeBlock(
				beforeHTML.replace( beforeLineRegexp, '' )
			),
			...blocks,
			...segmentHTMLToShortcodeBlock(
				afterHTML.replace( afterLineRegexp, '' )
			),
		];
	}

	return [ HTML ];
}

export default segmentHTMLToShortcodeBlock;
