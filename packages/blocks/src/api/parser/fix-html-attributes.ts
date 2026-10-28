import { getSaveContent } from '../serializer';
import { validateBlock } from '../validation';
import { parseHtml } from './get-block-attributes';
import type { Block, BlockType } from '../../types';

/**
 * Given an HTML string, returns its root element.
 *
 * @param innerHTML Markup string.
 *
 * @return Root element.
 */
function getHTMLRootElement( innerHTML: string ): HTMLElement | null {
	return parseHtml( innerHTML ).firstElementChild as HTMLElement | null;
}

/**
 * Given parsed block attributes, keeps the attributes of the block's root
 * element that its `save` doesn't produce in `htmlAttributes`, so they're
 * saved again. For `style`, only the properties `save` doesn't set are kept.
 * Classes are left to `fixCustomClassname`.
 *
 * @param blockAttributes Original block attributes.
 * @param blockType       Block type settings.
 * @param innerHTML       Original block markup.
 *
 * @return Filtered block attributes.
 */
export function fixHtmlAttributes(
	blockAttributes: Record< string, unknown >,
	blockType: BlockType,
	innerHTML: string
): Record< string, unknown > {
	if ( ! blockType.attributes?.htmlAttributes ) {
		return blockAttributes;
	}

	const { htmlAttributes, ...attributes } = blockAttributes;
	const saved = getHTMLRootElement( getSaveContent( blockType, attributes ) );
	const root = getHTMLRootElement( innerHTML );
	const unknownAttributes: Record< string, string > = {};
	for ( const { name, value } of Array.from( root?.attributes ?? [] ) ) {
		if (
			name !== 'class' &&
			name !== 'style' &&
			! saved?.hasAttribute( name )
		) {
			unknownAttributes[ name ] = value;
		}
	}
	// The browser reads the declarations, so values like `url("data:…;…")`
	// stay whole.
	for ( const property of Array.from( saved?.style ?? [] ) ) {
		root?.style.removeProperty( property );
	}
	if ( root?.style.length ) {
		unknownAttributes.style = root.style.cssText;
	}

	return Object.keys( unknownAttributes ).length
		? { ...attributes, htmlAttributes: unknownAttributes }
		: attributes;
}

/**
 * Given a block and its original markup in `originalContent`, keeps the
 * attributes of its root element that its `save` doesn't produce, if the block
 * then matches its markup.
 *
 * @param block     Block with its original markup.
 * @param blockType Block type settings.
 *
 * @return The block with the attributes kept, or undefined if it still doesn't
 *         match.
 */
export function applyHtmlAttributes(
	block: Block,
	blockType: BlockType
): Block | undefined {
	const fixedBlock = {
		...block,
		attributes: fixHtmlAttributes(
			block.attributes,
			blockType,
			block.originalContent ?? ''
		),
	};
	return validateBlock( fixedBlock, blockType )[ 0 ] ? fixedBlock : undefined;
}
