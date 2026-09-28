import { regexp, next } from '@wordpress/shortcode';
import { createBlock, getBlockTransforms, findTransform } from '../factory';
import { getBlockType } from '../registration';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { applyBuiltInValidationFixes } from '../parser/apply-built-in-validation-fixes';
import type {
	Block,
	BlockShortcodeTransform,
	NormalizedBlockTransform,
	ShortcodeTransformAttribute,
} from '../../types';

const castArray = < T >( maybeArray: T | T[] ): T[] =>
	Array.isArray( maybeArray ) ? maybeArray : [ maybeArray ];

const beforeLineRegexp = /(\n|<p>|<br\s*\/?>)\s*$/;
const afterLineRegexp = /^\s*(\n|<\/p>|<br\s*\/?>)/;

function segmentHTMLToShortcodeBlock(
	HTML: string,
	lastIndex: number = 0,
	excludedBlockNames: string[] = []
): Array< string | Block > {
	// Get all matches.
	const transformsFrom = getBlockTransforms( 'from' ).filter(
		(
			transform
		): transform is NormalizedBlockTransform< BlockShortcodeTransform > =>
			transform.type === 'shortcode'
	);

	const transformation = findTransform(
		transformsFrom,
		( transform ) =>
			excludedBlockNames.indexOf( transform.blockName ) === -1 &&
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

	const previousIndex = lastIndex;

	const match = next( transformTag!, HTML, lastIndex );

	if ( ! match ) {
		return [ HTML ];
	}

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

	let blocks: Block[] = [];
	if ( typeof transformation.transform === 'function' ) {
		// Passing all of `match` as second argument is intentionally broad
		// but shouldn't be too relied upon.
		//
		// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
		blocks = ( [] as Block[] ).concat(
			transformation.transform( match.shortcode.attrs, match )
		);

		// Applying the built-in fixes can enhance the attributes with missing content like "className".
		blocks = blocks.map( ( block: Block ) => {
			block.originalContent = match.shortcode.content;
			return applyBuiltInValidationFixes(
				block,
				getBlockType( block.name )!
			);
		} );
	} else {
		const blockType = getBlockType( transformation.blockName );
		if ( ! blockType ) {
			return [ HTML ];
		}

		// A shortcode transform without its own attributes sources them from
		// the block type it produces.
		const transformAttributes: Record<
			string,
			ShortcodeTransformAttribute
		> = transformation.attributes ?? blockType.attributes;

		const attributes = Object.fromEntries(
			Object.entries( transformAttributes )
				.filter( ( [ , schema ] ) => schema.shortcode )
				// Passing all of `match` as second argument is intentionally broad
				// but shouldn't be too relied upon.
				//
				// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
				.map( ( [ key, schema ] ) => [
					key,
					schema.shortcode!( match.shortcode.attrs, match ),
				] )
		);

		const transformationBlockType = {
			...blockType,
			attributes: transformAttributes,
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
		block = applyBuiltInValidationFixes( block, transformationBlockType );

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

export default segmentHTMLToShortcodeBlock;
