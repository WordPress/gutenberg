import { addFilter } from '@wordpress/hooks';
import { getBlockType } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import type { BlockListBlockFeatureProps, BlockWrapperProps } from './types';

declare global {
	interface Window {
		/**
		 * Whether the optional block delimiters experiment is enabled.
		 */
		__experimentalOptionalBlockDelimiters?: boolean;
	}
}

type HtmlAttributes = Record< string, string >;

/**
 * Adds `htmlAttributes`: attributes of a block's element that the block
 * doesn't know, read from its HTML. They're kept out of the delimiter.
 *
 * @param settings Block settings.
 *
 * @return Block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
	if (
		typeof window !== 'undefined' &&
		window.__experimentalOptionalBlockDelimiters
	) {
		settings.attributes = {
			...settings.attributes,
			htmlAttributes: { type: 'object', role: 'local' },
		};
	}
	return settings;
}

/**
 * Turns an inline style into a style object, as React expects.
 *
 * @param style Value of a `style` attribute.
 */
function getStyleObject( style: string ): Record< string, string > {
	const styleObject: Record< string, string > = {};
	for ( const declaration of style.split( ';' ) ) {
		const colonAt = declaration.indexOf( ':' );
		const property = declaration.slice( 0, colonAt ).trim();
		if ( colonAt === -1 || ! property ) {
			continue;
		}
		const key = property.startsWith( '--' )
			? property
			: property
					.toLowerCase()
					.replace( /^-ms-/, 'ms-' )
					.replace( /-([a-z])/g, ( _match, letter ) =>
						letter.toUpperCase()
					);
		styleObject[ key ] = declaration.slice( colonAt + 1 ).trim();
	}
	return styleObject;
}

/**
 * Adds attributes to props without replacing the block's own: its style
 * properties win over the same ones in `htmlAttributes`.
 *
 * @param props          Props.
 * @param htmlAttributes Attributes to add.
 */
function mergeHtmlAttributes(
	props: BlockWrapperProps,
	htmlAttributes: HtmlAttributes
): BlockWrapperProps {
	const { style, ...attributes } = htmlAttributes;
	const merged = { ...props };
	for ( const [ name, value ] of Object.entries( attributes ) ) {
		if ( ! ( name in merged ) ) {
			merged[ name ] = value;
		}
	}
	if ( style ) {
		merged.style = { ...getStyleObject( style ), ...props.style };
	}
	return merged;
}

export function addSaveProps(
	extraProps: BlockWrapperProps,
	_blockType: BlockType,
	{ htmlAttributes }: { htmlAttributes?: HtmlAttributes }
): BlockWrapperProps {
	return htmlAttributes
		? mergeHtmlAttributes( extraProps, htmlAttributes )
		: extraProps;
}

/**
 * Shows `htmlAttributes` in the editor, leaving out event handlers, script
 * links, and anything that would change how the block is edited.
 *
 * @param props                Block props.
 * @param props.htmlAttributes Attributes to show.
 */
function useBlockProps( {
	htmlAttributes,
}: BlockListBlockFeatureProps ): BlockWrapperProps {
	const safeAttributes = Object.fromEntries(
		Object.entries( htmlAttributes as HtmlAttributes ).filter(
			( [ name, value ] ) =>
				! name.startsWith( 'on' ) &&
				name !== 'contenteditable' &&
				! /^\s*javascript:/i.test( value )
		)
	);
	return mergeHtmlAttributes( {}, safeAttributes );
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'htmlAttributes' ],
	hasSupport( nameOrType: string | BlockType ) {
		const blockType =
			typeof nameOrType === 'string'
				? getBlockType( nameOrType )
				: nameOrType;
		return !! blockType?.attributes?.htmlAttributes;
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/editor/html-attributes/attribute',
	addAttribute
);
