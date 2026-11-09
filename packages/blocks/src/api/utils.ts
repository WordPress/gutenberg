import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';
import { Component, createElement, isValidElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { RichTextData } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import { BLOCK_ICON_DEFAULT } from './constants';
import { getBlockType, getDefaultBlockName } from './registration';
import type {
	Block,
	BlockType,
	BlockTypeIcon,
	BlockTypeIconDescriptor,
	BlockTypeIconRender,
	BlockAttribute,
} from '../types';

extend( [ namesPlugin, a11yPlugin ] );

/**
 * Array of icon colors containing a color to be used if the icon color
 * was not explicitly set but the icon background color was.
 */
const ICON_COLORS = [ '#191e23', '#f8f9f9' ];

/**
 * Matches what SVG files can have before the `svg` element: whitespace, an XML
 * prolog, comments and a doctype.
 */
const SVG_PREAMBLE =
	/^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>[]*(?:\[[\s\S]*?\]\s*)?>)*/i;

/**
 * Matches attributes that must not reach React as string props: event handlers
 * and the props React gives a special meaning.
 */
const UNSAFE_SVG_ATTRIBUTE =
	/^(?:on.*|dangerouslysetinnerhtml|children|key|ref)$/i;

/**
 * Converts an inline style string to the object React expects.
 *
 * @param style The value of a `style` attribute.
 * @return The style object.
 */
function parseInlineStyle( style: string ): Record< string, string > {
	const result: Record< string, string > = {};
	// Ignore semicolons inside parentheses, such as in a data URL.
	for ( const declaration of style.split( /;(?![^(]*\))/ ) ) {
		const separator = declaration.indexOf( ':' );
		const name = declaration.slice( 0, Math.max( separator, 0 ) ).trim();
		const value = declaration.slice( separator + 1 ).trim();
		if ( name && value ) {
			const key = name.startsWith( '--' )
				? name
				: name.replace( /-([a-z])/g, ( _, letter ) =>
						letter.toUpperCase()
					);
			result[ key ] = value;
		}
	}
	return result;
}

/**
 * Returns the React prop name for an SVG attribute, such as `strokeWidth` for
 * `stroke-width`.
 *
 * @param name The attribute name.
 * @return The prop name, or null if the attribute should be dropped.
 */
function getSvgPropName( name: string ): string | null {
	if ( UNSAFE_SVG_ATTRIBUTE.test( name ) ) {
		return null;
	}
	// Editors add namespaced attributes, such as `sketch:type`. Only `xlink` and
	// `xml` have a meaning in the DOM. React adds `xmlns` itself.
	if (
		name === 'xmlns' ||
		( name.includes( ':' ) && ! /^xlink:|^xml:/.test( name ) )
	) {
		return null;
	}
	if ( name === 'class' ) {
		return 'className';
	}
	if ( /^(?:aria|data)-/.test( name ) ) {
		return name;
	}
	return name.replace( /[-:]([a-z])/g, ( _, letter ) =>
		letter.toUpperCase()
	);
}

/**
 * Recursively converts a DOM node to a React element.
 *
 * @param node The DOM node to convert.
 * @return A React element representing the DOM node.
 */
function domNodeToReactElement(
	node: globalThis.Element | globalThis.Text
): React.ReactNode {
	if ( node.nodeType === Node.TEXT_NODE ) {
		const text = ( node as globalThis.Text ).textContent;
		if ( text?.trim() ) {
			return text;
		}
		return null;
	}

	if ( node.nodeType !== Node.ELEMENT_NODE ) {
		return null;
	}

	const element = node as globalThis.Element;
	// SVG names are case-sensitive, so `linearGradient` must keep its case.
	const tagName = element.tagName;
	// Skip elements that aren't part of the image: `style` would apply to the
	// whole page, and editors add namespaced ones such as `sodipodi:namedview`.
	if ( /^(?:script|style)$/i.test( tagName ) || tagName.includes( ':' ) ) {
		return null;
	}

	const props: Record< string, unknown > = {};

	for ( let i = 0; i < element.attributes.length; i++ ) {
		const attr = element.attributes[ i ];
		const propName = getSvgPropName( attr.name );
		if ( propName ) {
			props[ propName ] =
				propName === 'style'
					? parseInlineStyle( attr.value )
					: attr.value;
		}
	}

	const children: React.ReactNode[] = [];
	for ( let i = 0; i < element.childNodes.length; i++ ) {
		const child = element.childNodes[ i ];
		if (
			child.nodeType === Node.ELEMENT_NODE ||
			child.nodeType === Node.TEXT_NODE
		) {
			const converted = domNodeToReactElement(
				child as globalThis.Element | globalThis.Text
			);
			if ( converted !== null ) {
				children.push( converted );
			}
		}
	}

	if ( children.length > 0 ) {
		return createElement( tagName, props, ...children );
	}

	return createElement( tagName, props );
}

/**
 * Converts an SVG markup string to a React element.
 *
 * Uses the browser's native DOMParser to safely parse the SVG without
 * executing any scripts. The resulting React element can be rendered
 * by the `<Icon>` component which handles `icon.type === 'svg'`.
 *
 * @param icon The icon value, possibly an SVG string.
 * @return A React element if the input is an SVG string, otherwise the original value.
 */
export function convertSvgStringToIconElement( icon: unknown ): unknown {
	if ( typeof icon !== 'string' ) {
		return icon;
	}

	const svgContent = icon.replace( SVG_PREAMBLE, '' );
	if ( ! svgContent.startsWith( '<svg' ) ) {
		return icon;
	}

	try {
		const doc = new window.DOMParser().parseFromString(
			svgContent,
			'image/svg+xml'
		);
		const svgElement = doc.querySelector( 'svg' );
		if ( ! svgElement || doc.querySelector( 'parsererror' ) ) {
			return icon;
		}
		return domNodeToReactElement( svgElement );
	} catch {
		return icon;
	}
}

/**
 * Determines whether the block's attributes are equal to the default attributes
 * which means the block is unmodified.
 *
 * @param block Block Object.
 * @param role  Optional role to filter attributes for modification check.
 *
 * @return Whether the block is an unmodified block.
 */
export function isUnmodifiedBlock( block: Block, role?: string ): boolean {
	const blockAttributes = getBlockType( block.name )?.attributes ?? {};

	// Filter attributes by role if a role is provided.
	const attributesByRole: Array< [ string, BlockAttribute ] > = role
		? Object.entries( blockAttributes ).filter( ( [ key, definition ] ) => {
				// A special case for the metadata attribute.
				// It can include block bindings that serve as a source of content,
				// without directly modifying content attributes.
				if ( role === 'content' && key === 'metadata' ) {
					return (
						Object.keys(
							(
								block.attributes[ key ] as Record<
									string,
									unknown
								>
							 )?.bindings ?? {}
						).length > 0
					);
				}

				return (
					definition.role === role ||
					definition.__experimentalRole === role
				);
			} )
		: [];
	// Fallback to all attributes if no attributes match the role.
	const attributesToCheck: Array< [ string, BlockAttribute ] > =
		!! attributesByRole.length
			? attributesByRole
			: Object.entries( blockAttributes );

	return attributesToCheck.every( ( [ key, definition ] ) => {
		const value = block.attributes[ key ];

		// Every attribute that has a default must match the default.
		if ( definition.hasOwnProperty( 'default' ) ) {
			return value === definition.default;
		}

		// The rich text type is a bit different from the rest because it
		// has an implicit default value of an empty RichTextData instance,
		// so check the length of the value.
		if ( definition.type === 'rich-text' ) {
			return ! ( value as RichTextData )?.length;
		}

		// Every attribute that doesn't have a default should be undefined.
		return value === undefined;
	} );
}

/**
 * Determines whether the block is a default block and its attributes are equal
 * to the default attributes which means the block is unmodified.
 *
 * @param block Block Object
 * @param role  Optional role to filter attributes for modification check.
 *
 * @return Whether the block is an unmodified default block.
 */
export function isUnmodifiedDefaultBlock(
	block: Block,
	role?: string
): boolean {
	return (
		block.name === getDefaultBlockName() && isUnmodifiedBlock( block, role )
	);
}

/**
 * Function that checks if the parameter is a valid icon.
 *
 * @param icon Parameter to be checked.
 *
 * @return True if the parameter is a valid icon and false otherwise.
 */
export function isValidIcon( icon: unknown ): boolean {
	return (
		!! icon &&
		( typeof icon === 'string' ||
			isValidElement( icon ) ||
			typeof icon === 'function' ||
			icon instanceof Component )
	);
}

/**
 * Function that receives an icon as set by the blocks during the registration
 * and returns a new icon object that is normalized so we can rely on just on possible icon structure
 * in the codebase.
 *
 * @param icon Render behavior of a block type icon;
 *             one of a Dashicon slug, an element, or a component.
 *
 * @return Object describing the icon.
 */
export function normalizeIconObject(
	icon: BlockTypeIcon | undefined
): BlockTypeIconDescriptor {
	const resolvedIcon: BlockTypeIcon = icon || BLOCK_ICON_DEFAULT;
	if ( isValidIcon( resolvedIcon ) ) {
		return { src: resolvedIcon as BlockTypeIconRender };
	}

	const iconDescriptor = resolvedIcon as BlockTypeIconDescriptor;
	if ( 'background' in iconDescriptor ) {
		const colordBgColor = colord( iconDescriptor.background! );
		const getColorContrast = ( iconColor: string ) =>
			colordBgColor.contrast( iconColor );
		const maxContrast = Math.max( ...ICON_COLORS.map( getColorContrast ) );

		return {
			...iconDescriptor,
			foreground: iconDescriptor.foreground
				? iconDescriptor.foreground
				: ICON_COLORS.find(
						( iconColor ) =>
							getColorContrast( iconColor ) === maxContrast
					),
			shadowColor: colordBgColor.alpha( 0.3 ).toRgbString(),
		};
	}

	return iconDescriptor;
}

/**
 * Normalizes block type passed as param. When string is passed then
 * it converts it to the matching block type object.
 * It passes the original object otherwise.
 *
 * @param blockTypeOrName Block type or name.
 *
 * @return Block type.
 */
export function normalizeBlockType(
	blockTypeOrName: string | BlockType
): BlockType | undefined {
	if ( typeof blockTypeOrName === 'string' ) {
		return getBlockType( blockTypeOrName );
	}

	return blockTypeOrName;
}

/**
 * Get the label for the block, usually this is either the block title,
 * or the value of the block's `label` function when that's specified.
 *
 * @param blockType  The block type.
 * @param attributes The values of the block's attributes.
 * @param context    The intended use for the label.
 *
 * @return The block label.
 */
export function getBlockLabel(
	blockType: BlockType,
	attributes: Record< string, unknown >,
	context: string = 'visual'
): string {
	const { __experimentalLabel: getLabel, title } = blockType;

	const label = getLabel && getLabel( attributes, { context } );

	if ( ! label ) {
		return title;
	}

	if ( ( label as unknown as RichTextData ).toPlainText ) {
		return ( label as unknown as RichTextData ).toPlainText();
	}

	// Strip any HTML (i.e. RichText formatting) before returning.
	return stripHTML( label as string );
}

/**
 * Get a label for the block for use by screenreaders, this is more descriptive
 * than the visual label and includes the block title and the value of the
 * `getLabel` function if it's specified.
 *
 * @param blockType  The block type.
 * @param attributes The values of the block's attributes.
 * @param position   The position of the block in the block list.
 * @param direction  The direction of the block layout.
 *
 * @return The block label.
 */
export function getAccessibleBlockLabel(
	blockType: BlockType | undefined | null,
	attributes: Record< string, unknown >,
	position?: number,
	direction: string = 'vertical'
): string {
	// `title` is already localized, `label` is a user-supplied value.
	const title = blockType?.title ?? '';
	const label = blockType
		? getBlockLabel( blockType, attributes, 'accessibility' )
		: '';
	const hasPosition = position !== undefined;

	// getBlockLabel returns the block title as a fallback when there's no label,
	// if it did return the title, this function needs to avoid adding the
	// title twice within the accessible label. Use this `hasLabel` boolean to
	// handle that.
	const hasLabel = label && label !== title;

	if ( hasPosition && direction === 'vertical' ) {
		if ( hasLabel ) {
			return sprintf(
				/* translators: accessibility text. 1: The block title. 2: The block row number. 3: The block label.. */
				__( '%1$s Block. Row %2$d. %3$s' ),
				title,
				position,
				label
			);
		}

		return sprintf(
			/* translators: accessibility text. 1: The block title. 2: The block row number. */
			__( '%1$s Block. Row %2$d' ),
			title,
			position
		);
	} else if ( hasPosition && direction === 'horizontal' ) {
		if ( hasLabel ) {
			return sprintf(
				/* translators: accessibility text. 1: The block title. 2: The block column number. 3: The block label.. */
				__( '%1$s Block. Column %2$d. %3$s' ),
				title,
				position,
				label
			);
		}

		return sprintf(
			/* translators: accessibility text. 1: The block title. 2: The block column number. */
			__( '%1$s Block. Column %2$d' ),
			title,
			position
		);
	}

	if ( hasLabel ) {
		return sprintf(
			/* translators: accessibility text. 1: The block title. 2: The block label. */
			__( '%1$s Block. %2$s' ),
			title,
			label
		);
	}

	return sprintf(
		/* translators: accessibility text. %s: The block title. */
		__( '%s Block' ),
		title
	);
}

export function getDefault( attributeSchema: BlockAttribute ): unknown {
	if ( attributeSchema.default !== undefined ) {
		return attributeSchema.default;
	}

	if ( attributeSchema.type === 'rich-text' ) {
		return new RichTextData();
	}

	return undefined;
}

/**
 * Check if a block is registered.
 *
 * @param name The block's name.
 *
 * @return Whether the block is registered.
 */
export function isBlockRegistered( name: string ): boolean {
	return getBlockType( name ) !== undefined;
}

/**
 * Ensure attributes contains only values defined by block type, and merge
 * default values for missing attributes.
 *
 * @param name       The block's name.
 * @param attributes The block's attributes.
 * @return The sanitized attributes.
 */
export function sanitizeBlockAttributes(
	name: string,
	attributes: Record< string, unknown >
): Record< string, unknown > {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	if ( undefined === blockType ) {
		throw new Error( `Block type '${ name }' is not registered.` );
	}

	return Object.entries( blockType.attributes ).reduce(
		( accumulator: Record< string, unknown >, [ key, schema ] ) => {
			const value = attributes[ key ];

			if ( undefined !== value ) {
				if ( schema.type === 'rich-text' ) {
					if ( value instanceof RichTextData ) {
						accumulator[ key ] = value;
					} else if ( typeof value === 'string' ) {
						accumulator[ key ] =
							RichTextData.fromHTMLString( value );
					}
				} else if (
					schema.type === 'string' &&
					value instanceof RichTextData
				) {
					accumulator[ key ] = value.toHTMLString();
				} else {
					accumulator[ key ] = value;
				}
			} else {
				const _default = getDefault( schema );
				if ( undefined !== _default ) {
					accumulator[ key ] = _default;
				}
			}

			if (
				[ 'node', 'children' ].indexOf( schema.source ?? '' ) !== -1
			) {
				// Ensure value passed is always an array, which we're expecting in
				// the RichText component to handle the deprecated value.
				if ( typeof accumulator[ key ] === 'string' ) {
					accumulator[ key ] = [ accumulator[ key ] ];
				} else if ( ! Array.isArray( accumulator[ key ] ) ) {
					accumulator[ key ] = [];
				}
			}

			return accumulator;
		},
		{}
	);
}

export function __experimentalSanitizeBlockAttributes(
	name: string,
	attributes: Record< string, unknown >
): Record< string, unknown > {
	deprecated( '__experimentalSanitizeBlockAttributes', {
		since: '7.1',
		alternative: 'sanitizeBlockAttributes',
	} );

	return sanitizeBlockAttributes( name, attributes );
}

/**
 * Filter block attributes by `role` and return their names.
 *
 * @param name Block attribute's name.
 * @param role The role of a block attribute.
 *
 * @return The attribute names that have the provided role.
 */
export function getBlockAttributesNamesByRole(
	name: string,
	role?: string
): string[] {
	const attributes = getBlockType( name )?.attributes;
	if ( ! attributes ) {
		return [];
	}
	const attributesNames = Object.keys( attributes );
	if ( ! role ) {
		return attributesNames;
	}

	return attributesNames.filter( ( attributeName ) => {
		const attribute = attributes[ attributeName ];
		if ( attribute?.role === role ) {
			return true;
		}
		if ( attribute?.__experimentalRole === role ) {
			deprecated( '__experimentalRole attribute', {
				since: '6.7',
				version: '6.8',
				alternative: 'role attribute',
				hint: `Check the block.json of the ${ name } block.`,
			} );
			return true;
		}
		return false;
	} );
}

export const __experimentalGetBlockAttributesNamesByRole = (
	...args: Parameters< typeof getBlockAttributesNamesByRole >
): string[] => {
	deprecated( '__experimentalGetBlockAttributesNamesByRole', {
		since: '6.7',
		version: '6.8',
		alternative: 'getBlockAttributesNamesByRole',
	} );
	return getBlockAttributesNamesByRole( ...args );
};

/**
 * Checks if a block is a content block by examining its attributes.
 * A block is considered a content block if it has at least one attribute
 * with a role of 'content'.
 *
 * @param name The name of the block to check.
 * @return Whether the block is a content block.
 */
export function isContentBlock( name: string ): boolean {
	const blockType = getBlockType( name );
	const attributes = blockType?.attributes;
	// Not all blocks have attributes but they may support contentRole instead.
	const supportsContentRole = (
		blockType?.supports as Record< string, unknown >
	 )?.contentRole;

	if ( supportsContentRole ) {
		return true;
	}
	if ( ! attributes ) {
		return false;
	}

	return !! Object.keys( attributes )?.some( ( attributeKey ) => {
		const attribute = attributes[ attributeKey ];
		return (
			attribute?.role === 'content' ||
			attribute?.__experimentalRole === 'content'
		);
	} );
}

/**
 * Return a new object with the specified keys omitted.
 *
 * @param object Original object.
 * @param keys   Keys to be omitted.
 *
 * @return Object with omitted keys.
 */
export function omit< T extends Record< string, unknown > >(
	object: T,
	keys: string | string[]
): T {
	const keysArray = Array.isArray( keys ) ? keys : [ keys ];
	return Object.fromEntries(
		Object.entries( object ).filter(
			( [ key ] ) => ! keysArray.includes( key )
		)
	) as T;
}
