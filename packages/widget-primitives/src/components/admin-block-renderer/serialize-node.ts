/**
 * WordPress dependencies
 */
import type { parse } from '@wordpress/block-serialization-default-parser';

type ParsedNode = ReturnType< typeof parse >[ number ];

/*
 * Reconstructs the comment-delimited markup for a parsed block. Splices inner
 * blocks back into their `innerContent` placeholders, so nested blocks
 * round-trip and not only leaves.
 *
 * `serializeRawBlock()` in `@wordpress/blocks` is the canonical equivalent,
 * unused here because that package pulls 26 dependencies into one that carries
 * four. It also joins inner content with newlines and collapses them, where
 * this preserves the markup as parsed.
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
