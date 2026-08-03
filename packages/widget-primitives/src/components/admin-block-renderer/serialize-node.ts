/**
 * WordPress dependencies
 */
import type { parse } from '@wordpress/block-serialization-default-parser';

type ParsedNode = ReturnType< typeof parse >[ number ];

/*
 * Reconstructs the comment-delimited markup for a parsed block so the SSR
 * fallback can resolve it through `do_blocks()`. Walks `innerContent`,
 * splicing each inner block back in at its placeholder, so nested blocks
 * round-trip faithfully (not only leaf blocks).
 *
 * Core owns the canonical version of this, `serializeRawBlock()` in
 * `@wordpress/blocks`, built on `getCommentDelimitedContent()`. It is not used
 * here because that package carries 26 dependencies (a data store, rich-text,
 * a markdown parser, a shortcode parser), and this one deliberately carries
 * three. The same reasoning already picked the standalone grammar parser over
 * `blocks.parse`. Core published the parser as its own package but not the
 * serializer, so there is no light path back.
 *
 * One behavioral difference: `serializeRawBlock()` joins inner content with
 * newlines and collapses runs of them, while this preserves the markup as
 * parsed, so it round-trips byte for byte.
 */
export function serializeNode( node: ParsedNode ): string {
	const name = node.blockName;

	/* Freeform content carries no delimiters. */
	if ( ! name ) {
		return node.innerHTML;
	}

	/* Core blocks serialize without their `core/` namespace. */
	const shortName = name.startsWith( 'core/' ) ? name.slice( 5 ) : name;
	const attrs =
		node.attrs && Object.keys( node.attrs ).length
			? ' ' + JSON.stringify( node.attrs )
			: '';

	/* No inner content at all: a self-closing (void) block. */
	if ( node.innerContent.length === 0 ) {
		return `<!-- wp:${ shortName }${ attrs } /-->`;
	}

	/*
	 * `innerContent` interleaves literal HTML chunks (strings) with null
	 * placeholders, one per inner block in order; recurse to fill them.
	 */
	let innerBlockIndex = 0;
	const inner = node.innerContent
		.map( ( chunk ) =>
			chunk === null
				? serializeNode( node.innerBlocks[ innerBlockIndex++ ] )
				: chunk
		)
		.join( '' );

	return `<!-- wp:${ shortName }${ attrs } -->${ inner }<!-- /wp:${ shortName } -->`;
}
