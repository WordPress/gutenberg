/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../registration';
import { getSaveContent } from '../serializer';
import { parseWithAttributeSchema } from './get-block-attributes';
import type { BlockAttribute, BlockType } from '../../types';

const CLASS_ATTR_SCHEMA: BlockAttribute = {
	type: 'string',
	source: 'attribute',
	selector: '[data-custom-class-name] > *',
	attribute: 'class',
};

/**
 * Given an HTML string, returns an array of class names assigned to the root
 * element in the markup.
 *
 * @param innerHTML Markup string from which to extract classes.
 *
 * @return Array of class names assigned to the root element.
 */
export function getHTMLRootElementClasses( innerHTML: string ): string[] {
	const parsed = parseWithAttributeSchema(
		`<div data-custom-class-name>${ innerHTML }</div>`,
		CLASS_ATTR_SCHEMA
	) as string | undefined;

	return parsed ? parsed.trim().split( /\s+/ ) : [];
}

/**
 * Given a parsed set of block attributes, if the block supports custom class
 * names and an unknown class (per the block's serialization behavior) is
 * found, the unknown classes are treated as custom classes. This prevents the
 * block from being considered as invalid.
 *
 * @param blockAttributes Original block attributes.
 * @param blockType       Block type settings.
 * @param innerHTML       Original block markup.
 *
 * @return Filtered block attributes.
 */
export function fixCustomClassname(
	blockAttributes: Record< string, unknown >,
	blockType: BlockType,
	innerHTML: string
): Record< string, unknown > {
	if ( ! hasBlockSupport( blockType, 'customClassName', true ) ) {
		return blockAttributes;
	}

	const modifiedBlockAttributes = { ...blockAttributes };
	// To determine difference, serialize block given the known set of
	// attributes, with the exception of `className`. This will determine
	// the default set of classes. From there, any difference in innerHTML
	// can be considered as custom classes.
	const { className: omittedClassName, ...attributesSansClassName } =
		modifiedBlockAttributes;
	const serialized = getSaveContent( blockType, attributesSansClassName );
	const defaultClasses = getHTMLRootElementClasses( serialized );
	const actualClasses = getHTMLRootElementClasses( innerHTML );

	const customClasses = actualClasses.filter(
		( className ) => ! defaultClasses.includes( className )
	);

	if ( customClasses.length ) {
		modifiedBlockAttributes.className = customClasses.join( ' ' );
	} else if ( serialized ) {
		delete modifiedBlockAttributes.className;
	}

	return modifiedBlockAttributes;
}
