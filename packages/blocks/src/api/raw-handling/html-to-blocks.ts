import { createBlock, findTransform } from '../factory';
import { getBlockAttributes } from '../parser/get-block-attributes';
import { hasBlockSupport } from '../registration';
import { getBlockDefaultClassName } from '../serializer';
import { getRawTransforms } from './get-raw-transforms';
import type { Block, RawHandler } from '../../types';

/**
 * Converts a single element into the block whose raw transform claims it.
 *
 * @param node    Element to convert.
 * @param handler The handler calling the conversion: either rawHandler
 *                or pasteHandler.
 *
 * @return The block the element becomes — or several, when a transform
 *          written in JavaScript returns more than one.
 */
export function nodeToBlock(
	node: Element,
	handler: RawHandler
): Block | Block[] {
	const transforms = getRawTransforms();
	const rawTransform = findTransform( transforms, ( transform ) =>
		transform.isMatch( node )
	);

	if ( ! rawTransform ) {
		return createBlock(
			// Should not be hardcoded.
			'core/html',
			{},
			[],
			[ node.outerHTML ]
		);
	}

	const { transform, blockName } = rawTransform;

	const block = transform
		? ( transform( node, handler ) as Block | Block[] )
		: createBlock(
				blockName,
				getBlockAttributes( blockName, node.outerHTML )
		  );

	// A raw transform may return several blocks, in which case it is unclear
	// which of them the node's class and id belong on, so only the
	// single-block case carries them.
	if ( Array.isArray( block ) ) {
		return block;
	}

	/*
	 * The node's classes belong to the block whether the transform is written
	 * in JavaScript or declared in `block.json`; a declared one would
	 * otherwise drop them, because `className` is a block support with no
	 * source to read them from. The support's own rules apply, as they do on
	 * the server: nothing is kept for a block that opts out of custom class
	 * names, and the block's generated class is the support's to re-add, not
	 * a custom class.
	 */
	if (
		hasBlockSupport( blockName, 'customClassName', true ) &&
		node.hasAttribute( 'class' )
	) {
		const generatedClassName = getBlockDefaultClassName( blockName );
		const className = node
			.getAttribute( 'class' )!
			.split( /\s+/ )
			.filter( ( name ) => name && name !== generatedClassName )
			.join( ' ' );

		if ( className ) {
			block.attributes.className = className;
		}
	}

	// An `id` becomes the block's anchor the same way, for blocks declaring
	// the `anchor` support — mirroring the server's conversion.
	if ( hasBlockSupport( blockName, 'anchor' ) && node.getAttribute( 'id' ) ) {
		block.attributes.anchor = node.getAttribute( 'id' );
	}

	return block;
}

/**
 * Converts HTML directly to blocks. Looks for a matching transform for each
 * top-level tag. The HTML should be filtered to not have any text between
 * top-level tags and formatted in a way that blocks can handle the HTML.
 *
 * @param html    HTML to convert.
 * @param handler The handler calling htmlToBlocks: either rawHandler
 *                or pasteHandler.
 *
 * @return An array of blocks.
 */
export function htmlToBlocks( html: string, handler: RawHandler ): Block[] {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = html;

	return Array.from( doc.body.children ).flatMap( ( node ) =>
		nodeToBlock( node, handler )
	);
}
