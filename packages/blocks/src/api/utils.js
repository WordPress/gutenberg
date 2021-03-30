/**
 * External dependencies
 */
import { every, has, isFunction, isString, reduce } from 'lodash';
import { default as tinycolor, mostReadable } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { Component, isValidElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getBlockType, getDefaultBlockName } from './registration';
import { createBlock } from './factory';

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
 * @param  {WPBlock} block Block Object
 *
 * @return {boolean}       Whether the block is an unmodified default block
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
		blockType.attributes,
		( value, key ) =>
			newDefaultBlock.attributes[ key ] === block.attributes[ key ]
	);
}

/**
 * Function that checks if the parameter is a valid icon.
 *
 * @param {*} icon  Parameter to be checked.
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
	if ( isValidIcon( icon ) ) {
		return { src: icon };
	}

	if ( has( icon, [ 'background' ] ) ) {
		const tinyBgColor = tinycolor( icon.background );

		return {
			...icon,
			foreground: icon.foreground
				? icon.foreground
				: mostReadable( tinyBgColor, ICON_COLORS, {
						includeFallbackColors: true,
						level: 'AA',
						size: 'large',
				  } ).toHexString(),
			shadowColor: tinyBgColor.setAlpha( 0.3 ).toRgbString(),
		};
	}

	return icon;
}

/**
 * Normalizes block type passed as param. When string is passed then
 * it converts it to the matching block type object.
 * It passes the original object otherwise.
 *
 * @param {string|Object} blockTypeOrName  Block type or name.
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
 * @param {number} blocksTotal The total number of blocks.
 * @param {string} parentTitle In the event of a child block, this param gets the title of the parent block.
 *
 * @return {string} The block label.
 */
export function getAccessibleBlockLabel(
	blockType,
	attributes,
	position,
	direction = 'vertical',
	blocksTotal,
	parentTitle
) {
	// `title` is already localized, `label` is a user-supplied value.
	const { title } = blockType;
	const label = getBlockLabel( blockType, attributes, 'accessibility' );
	const hasPosition = position !== undefined;
	const hasParentTitle = parentTitle !== undefined;

	// getBlockLabel returns the block title as a fallback when there's no label,
	// if it did return the title, this function needs to avoid adding the
	// title twice within the accessible label. Use this `hasLabel` boolean to
	// handle that.
	const hasLabel = label && label !== title;

	if ( hasPosition && direction === 'vertical' ) {
		if ( hasLabel ) {
			if ( hasParentTitle ) {
				return sprintf(
					/* translators: accessibility text. 1: The block title. 2: The block row number. 3: The total number of blocks. 4: The parent block title. 5: The block label.. */
					__( '%1$s Block. %2$d of %3$d. Child of %4$s Block. %5$s' ),
					title,
					position,
					blocksTotal,
					parentTitle,
					label
				);
			}
			return sprintf(
				/* translators: accessibility text. 1: The block title. 2: The block row number. 3: The total number of blocks. 4: The block label.. */
				__( '%1$s Block. %2$d of %3$d. %4$s' ),
				title,
				position,
				blocksTotal,
				label
			);
		}

		if ( hasParentTitle ) {
			return sprintf(
				/* translators: accessibility text. 1: The block title. 2: The block row number. 3: The total number of blocks. 4: The parent block title. */
				__( '%1$s Block. %2$d of %3$d. Child of %4$s Block.' ),
				title,
				position,
				blocksTotal,
				parentTitle
			);
		}
		return sprintf(
			/* translators: accessibility text. 1: The block title. 2: The block row number. 3: The total number of blocks. */
			__( '%1$s Block. %2$d of %3$d.' ),
			title,
			position,
			blocksTotal
		);
	} else if ( hasPosition && direction === 'horizontal' ) {
		if ( hasLabel ) {
			if ( hasParentTitle ) {
				return sprintf(
					/* translators: accessibility text. 1: The block title. 2: The block column number. 3: The total number of blocks. 4: The block parent title. 5: The block label.. */
					__( '%1$s Block. Column %2$d of %3$d. Child of %4$s Block. %5$s' ),
					title,
					position,
					blocksTotal,
					parentTitle,
					label
				);
			}
			return sprintf(
				/* translators: accessibility text. 1: The block title. 2: The block column number. 3: The total number of blocks. 4: The block label.. */
				__( '%1$s Block. Column %2$d of %3$d. %4$s' ),
				title,
				position,
				blocksTotal,
				label
			);
		}

		if ( hasParentTitle ) {
			return sprintf(
				/* translators: accessibility text. 1: The block title. 2: The block column number. 3: The total number of blocks. 4: The block parent title. */
				__( '%1$s Block. Column %2$d of %3$d. Child of %4$s Block.' ),
				title,
				position,
				blocksTotal,
				parentTitle
			);
		}
		return sprintf(
			/* translators: accessibility text. 1: The block title. 2: The block column number. 3: The total number of blocks. */
			__( '%1$s Block. Column %2$d of %3$d.' ),
			title,
			position,
			blocksTotal
		);
	}

	if ( hasLabel ) {
		return sprintf(
			/* translators: 1: The block title. 2: The block label. */
			__( '%1$s Block. %2$s' ),
			title,
			label
		);
	}
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
