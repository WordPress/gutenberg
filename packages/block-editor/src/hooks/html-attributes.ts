import { addFilter } from '@wordpress/hooks';
import { getBlockType } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { getReactStyleKey } from './style';
import type { BlockListBlockFeatureProps, BlockWrapperProps } from './types';

type HtmlAttributes = Record< string, string >;

// Global HTML attributes that describe content without changing how it
// behaves. Others, like event handlers and links, leave the block invalid.
const ALLOWED_ATTRIBUTES = new Set( [
	'dir',
	'id',
	'itemid',
	'itemprop',
	'itemref',
	'itemscope',
	'itemtype',
	'lang',
	'role',
	'style',
	'title',
	'translate',
] );

/**
 * Adds `htmlAttributes`: attributes of a block's element that the block
 * doesn't know, read from its HTML. They're kept out of the delimiter.
 *
 * @param settings Block settings.
 *
 * @return Block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
	settings.attributes = {
		...settings.attributes,
		htmlAttributes: { type: 'object', role: 'local' },
	};
	return settings;
}

/**
 * Turns an inline style into a style object, as React expects. The browser
 * reads the declarations, so values like `url("data:…;…")` stay whole.
 *
 * @param style Value of a `style` attribute.
 */
function getStyleObject( style: string ): Record< string, string > {
	const element = document.createElement( 'div' );
	element.style.cssText = style;
	return Object.fromEntries(
		Array.from( element.style, ( property ) => [
			getReactStyleKey( property ),
			element.style.getPropertyValue( property ),
		] )
	);
}

/**
 * Adds the allowed attributes to props without replacing the block's own,
 * including its style properties.
 *
 * @param props          Props.
 * @param htmlAttributes Attributes to add.
 */
function mergeHtmlAttributes(
	props: BlockWrapperProps,
	htmlAttributes: HtmlAttributes
): BlockWrapperProps {
	const { style, ...attributes } = Object.fromEntries(
		Object.entries( htmlAttributes ).filter(
			( [ name ] ) =>
				name.startsWith( 'data-' ) ||
				name.startsWith( 'aria-' ) ||
				ALLOWED_ATTRIBUTES.has( name )
		)
	);
	// The block's own props go first and last: they keep their place and win.
	const merged = { ...props, ...attributes, ...props };
	if ( style ) {
		merged.style = {
			...props.style,
			...getStyleObject( style ),
			...props.style,
		};
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
 * Shows `htmlAttributes` in the editor.
 *
 * @param props                Block props.
 * @param props.htmlAttributes Attributes to show.
 */
function useBlockProps( {
	htmlAttributes,
}: BlockListBlockFeatureProps ): BlockWrapperProps {
	return mergeHtmlAttributes( {}, htmlAttributes as HtmlAttributes );
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
