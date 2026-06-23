/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../registration';
import { getSaveContent } from '../serializer';
import { parseHtml } from './get-block-attributes';
import type { BlockType } from '../../types';

function splitClassName( className: unknown ): string[] {
	return typeof className === 'string' && className
		? className.trim().split( /\s+/ )
		: [];
}

function getElementClasses( element: Element | null ): string[] {
	return splitClassName( element?.getAttribute( 'class' ) );
}

/**
 * Given an HTML string, returns an array of class names assigned to the root
 * element in the markup.
 *
 * @param innerHTML Markup string from which to extract classes.
 *
 * @return Array of class names assigned to the root element.
 */
export function getHTMLRootElementClasses( innerHTML: string ): string[] {
	const root = ( parseHtml( innerHTML ) as Element )?.firstElementChild;
	return getElementClasses( root );
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
 * @param rootElement     Pre-parsed root element of innerHTML, if available.
 *                        When provided, avoids re-parsing innerHTML to read
 *                        the actual classes.
 *
 * @return Filtered block attributes.
 */
export function fixCustomClassname(
	blockAttributes: Record< string, unknown >,
	blockType: BlockType,
	innerHTML: string,
	rootElement?: Element | null
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
	// `getHTMLRootElementClasses` writes the rendered output into hpq's
	// shared document body. Callers that pass `rootElement` are insulated by
	// the deep clone of `parsedBody` in `parseRawBlock`; without that clone,
	// this parse would mutate the shared body under our feet.
	const defaultClasses = getHTMLRootElementClasses( serialized );
	const actualClasses =
		rootElement !== undefined
			? getElementClasses( rootElement )
			: getHTMLRootElementClasses( innerHTML );

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
