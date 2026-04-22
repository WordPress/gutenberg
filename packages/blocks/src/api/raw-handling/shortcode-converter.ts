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
import type { Block } from '../../types';

interface ShortcodeTransform {
	type: string;
	blockName: string;
	tag: string | string[];
	isMatch?: ( attrs: unknown ) => boolean;
	transform?: ( ...args: unknown[] ) => Block | Block[];
	attributes: Record<
		string,
		{ shortcode?: ( ...args: unknown[] ) => unknown }
	>;
}

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
	const transformsFrom = getBlockTransforms(
		'from'
	) as unknown as ShortcodeTransform[];

	const transformation = findTransform(
		transformsFrom as unknown as Parameters< typeof findTransform >[ 0 ],
		( ( transform: unknown ) => {
			const t = transform as ShortcodeTransform;
			return (
				excludedBlockNames.indexOf( t.blockName ) === -1 &&
				t.type === 'shortcode' &&
				castArray( t.tag ).some( ( tag: string ) =>
					regexp( tag ).test( HTML )
				)
			);
		} ) as Parameters< typeof findTransform >[ 1 ]
	) as unknown as ShortcodeTransform | null;

	if ( ! transformation ) {
		return [ HTML ];
	}

	const transformTags = castArray( transformation.tag );
	const transformTag = transformTags.find( ( tag ) =>
		regexp( tag ).test( HTML )
	);

	let match: any;
	const previousIndex = lastIndex;

	if ( ( match = next( transformTag!, HTML, lastIndex ) ) ) {
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
				transformation.blockName!,
			] );
		}

		let blocks: Block[] = [];
		if ( typeof transformation.transform === 'function' ) {
			// Passing all of `match` as second argument is intentionally broad
			// but shouldn't be too relied upon.
			//
			// See: https://github.com/WordPress/gutenberg/pull/3610#discussion_r152546926
			blocks = ( [] as Block[] ).concat(
				transformation.transform( match.shortcode.attrs, match ) as
					| Block
					| Block[]
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
			const attributes = Object.fromEntries(
				Object.entries( transformation.attributes )
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
					transformationBlockType as unknown as string,
					match.shortcode.content,
					attributes
				)
			);

			// Applying the built-in fixes can enhance the attributes with missing content like "className".
			block.originalContent = match.shortcode.content;
			block = applyBuiltInValidationFixes(
				block,
				transformationBlockType as unknown as Parameters<
					typeof applyBuiltInValidationFixes
				>[ 1 ]
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
