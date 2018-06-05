/**
 * External dependencies
 */
import { every, keys, isEqual } from 'lodash';
import { default as tinycolor, mostReadable } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getDefaultBlockName } from './registration';
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

	const newDefaultBlock = createBlock( defaultBlockName );

	const attributeKeys = applyFilters( 'blocks.isUnmodifiedDefaultBlock.attributes', [
		...keys( newDefaultBlock.attributes ),
		...keys( block.attributes ),
	] );

	return every( attributeKeys, ( key ) =>
		isEqual( newDefaultBlock.attributes[ key ], block.attributes[ key ] )
	);
}

/**
 * Function that receives an icon as set by the blocks during the registration
 * and returns a new icon object that is normalized so we can rely on just on possible icon structure
 * in the codebase.
 *
 * @param {(Object|string|WPElement)} icon  Slug of the Dashicon to be shown
 *                                          as the icon for the block in the
 *                                          inserter, or element or an object describing the icon.
 *
 * @return {Object} Object describing the icon.
 */
export function normalizeIconObject( icon ) {
	if ( ! icon ) {
		return { src: 'block-default' };
	}
	if ( ! icon.src ) {
		return { src: icon };
	}

	if ( icon.background ) {
		const tinyBgColor = tinycolor( icon.background );
		if ( ! icon.foreground ) {
			const foreground = mostReadable(
				tinyBgColor,
				ICON_COLORS,
				{ includeFallbackColors: true, level: 'AA', size: 'large' }
			).toHexString();
			icon.foreground = foreground;
		}
		icon.shadowColor = tinyBgColor.setAlpha( 0.3 ).toRgbString();
	}
	return icon;
}
