/**
 * External dependencies
 */
import { every, has, isFunction, isString, reduce, maxBy } from 'lodash';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { Component, isValidElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { BLOCK_ICON_DEFAULT } from './constants';
import { getBlockType, getDefaultBlockName } from './registration';
import { createBlock } from './factory';

extend( [ namesPlugin, a11yPlugin ] );

/**
 * Array of icon colors containing a color to be used if the icon color
 * was not explicitly set but the icon background color was.
 *
 * @type {Object}
 */
const ICON_COLORS = [ '#191e23', '#f8f9f9' ];

/**
 * Determines whether the block is a default block
 * and its attributes are equal to the default attributes
 * which means the block is unmodified.
 *
 * @param {WPBlock} block Block Object
 *
 * @return {boolean} Whether the block is an unmodified default block
 */
export function isUnmodifiedDefaultBlock( block ) {
	const defaultBlockName = getDefaultBlockName();
	if ( block.name !== defaultBlockName ) {
		return false;
	}

	// Cache a created default block if no cache exists or the default block
	// name changed.
	if (
		! isUnmodifiedDefaultBlock.block ||
		isUnmodifiedDefaultBlock.block.name !== defaultBlockName
	) {
		isUnmodifiedDefaultBlock.block = createBlock( defaultBlockName );
	}

	const newDefaultBlock = isUnmodifiedDefaultBlock.block;
	const blockType = getBlockType( defaultBlockName );

	return every(
		blockType?.attributes,
		( value, key ) =>
			newDefaultBlock.attributes[ key ] === block.attributes[ key ]
	);
}

/**
 * Function that checks if the parameter is a valid icon.
 *
 * @param {*} icon Parameter to be checked.
 *
 * @return {boolean} True if the parameter is a valid icon and false otherwise.
 */

export function isValidIcon( icon ) {
	return (
		!! icon &&
		( isString( icon ) ||
			isValidElement( icon ) ||
			isFunction( icon ) ||
			icon instanceof Component )
	);
}

/**
 * Function that receives an icon as set by the blocks during the registration
 * and returns a new icon object that is normalized so we can rely on just on possible icon structure
 * in the codebase.
 *
 * @param {WPBlockTypeIconRender} icon Render behavior of a block type icon;
 *                                     one of a Dashicon slug, an element, or a
 *                                     component.
 *
 * @return {WPBlockTypeIconDescriptor} Object describing the icon.
 */
export function normalizeIconObject( icon ) {
	icon = icon || BLOCK_ICON_DEFAULT;
	if ( isValidIcon( icon ) ) {
		return { src: icon };
	}

	if ( has( icon, [ 'background' ] ) ) {
		const colordBgColor = colord( icon.background );

		return {
			...icon,
			foreground: icon.foreground
				? icon.foreground
				: maxBy( ICON_COLORS, ( iconColor ) =>
						colordBgColor.contrast( iconColor )
				  ),
			shadowColor: colordBgColor.alpha( 0.3 ).toRgbString(),
		};
	}

	return icon;
}

/**
 * Normalizes block type passed as param. When string is passed then
 * it converts it to the matching block type object.
 * It passes the original object otherwise.
 *
 * @param {string|Object} blockTypeOrName Block type or name.
 *
 * @return {?Object} Block type.
 */
export function normalizeBlockType( blockTypeOrName ) {
	if ( isString( blockTypeOrName ) ) {
		return getBlockType( blockTypeOrName );
	}

	return blockTypeOrName;
}

/**
 * Get the label for the block, usually this is either the block title,
 * or the value of the block's `label` function when that's specified.
 *
 * @param {Object} blockType  The block type.
 * @param {Object} attributes The values of the block's attributes.
 * @param {Object} context    The intended use for the label.
 *
 * @return {string} The block label.
 */
export function getBlockLabel( blockType, attributes, context = 'visual' ) {
	const { __experimentalLabel: getLabel, title } = blockType;

	const label = getLabel && getLabel( attributes, { context } );

	if ( ! label ) {
		return title;
	}

	// Strip any HTML (i.e. RichText formatting) before returning.
	return stripHTML( label );
}

/**
 * Get a label for the block for use by screenreaders, this is more descriptive
 * than the visual label and includes the block title and the value of the
 * `getLabel` function if it's specified.
 *
 * @param {Object}  blockType              The block type.
 * @param {Object}  attributes             The values of the block's attributes.
 * @param {?number} position               The position of the block in the block list.
 * @param {string}  [direction='vertical'] The direction of the block layout.
 *
 * @return {string} The block label.
 */
export function getAccessibleBlockLabel(
	blockType,
	attributes,
	position,
	direction = 'vertical'
) {
	// `title` is already localized, `label` is a user-supplied value.
	const title = blockType?.title;
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
			/* translators: accessibility text. %1: The block title. %2: The block label. */
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

/**
 * Ensure attributes contains only values defined by block type, and merge
 * default values for missing attributes.
 *
 * @param {string} name       The block's name.
 * @param {Object} attributes The block's attributes.
 * @return {Object} The sanitized attributes.
 */
export function __experimentalSanitizeBlockAttributes( name, attributes ) {
	// Get the type definition associated with a registered block.
	const blockType = getBlockType( name );

	if ( undefined === blockType ) {
		throw new Error( `Block type '${ name }' is not registered.` );
	}

	return reduce(
		blockType.attributes,
		( accumulator, schema, key ) => {
			const value = attributes[ key ];

			if ( undefined !== value ) {
				accumulator[ key ] = value;
			} else if ( schema.hasOwnProperty( 'default' ) ) {
				accumulator[ key ] = schema.default;
			}

			if ( [ 'node', 'children' ].indexOf( schema.source ) !== -1 ) {
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

/**
 * Filter block attributes by `role` and return their names.
 *
 * @param {string} name Block attribute's name.
 * @param {string} role The role of a block attribute.
 *
 * @return {string[]} The attribute names that have the provided role.
 */
export function __experimentalGetBlockAttributesNamesByRole( name, role ) {
	const attributes = getBlockType( name )?.attributes;
	if ( ! attributes ) return [];
	const attributesNames = Object.keys( attributes );
	if ( ! role ) return attributesNames;
	return attributesNames.filter(
		( attributeName ) =>
			attributes[ attributeName ]?.__experimentalRole === role
	);
}
