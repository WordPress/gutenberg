/**
 * External dependencies
 */
import { every, has, isFunction, isString } from 'lodash';
import { default as tinycolor, mostReadable } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { Component, isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getBlockType, getDefaultBlockName } from './registration';
import { createBlock } from './factory';

/**
 * @typedef {import('@wordpress/blocks').Block<Record<string,any>>} BlockType
 */

/**
 * @typedef {import('@wordpress/blocks').BlockIcon} BlockIcon
 */

/**
 * @typedef {import('@wordpress/blocks').BlockInstance<Record<string,any>>} BlockInstance
 */

/**
 * Array of icon colors containing a color to be used if the icon color
 * was not explicitly set but the icon background color was.
 *
 * @type {readonly string[]}
 */
const ICON_COLORS = [ '#191e23', '#f8f9f9' ];

/**
 * Determines whether the block is a default block and its attributes are equal
 * to the default attributes which means the block is unmodified.
 *
 * @param  {BlockInstance} block Block instance.
 *
 * @return {boolean} Whether the block is an unmodified default block.
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

	return every( blockType.attributes, ( _, key ) =>
		newDefaultBlock.attributes[ key ] === block.attributes[ key ]
	);
}

/**
 * Function that checks if the parameter is a valid icon.
 *
 * @param {any} icon  Parameter to be checked.
 *
 * @return {boolean} True if the parameter is a valid icon and false otherwise.
 */
export function isValidIcon( icon ) {
	return !! icon && (
		isString( icon ) ||
		isValidElement( icon ) ||
		isFunction( icon ) ||
		icon instanceof Component
	);
}

/**
 * Function that receives an icon as set by the blocks during the registration
 * and returns a new icon object that is normalized so we can rely on just on possible icon structure
 * in the codebase.
 *
 * @param {BlockIcon} icon  Slug of the Dashicon to be shown
 *                                          as the icon for the block in the
 *                                          inserter, or element or an object describing the icon.
 *
 * @return {BlockIcon} Object describing the icon.
 */
export function normalizeIconObject( icon ) {
	if ( isValidIcon( icon ) ) {
		return { src: icon };
	}

	if ( typeof icon === 'object' && has( icon, [ 'background' ] ) ) {
		const tinyBgColor = tinycolor( icon.background );

		return {
			...icon,
			foreground: icon.foreground ? icon.foreground : mostReadable(
				tinyBgColor,
				ICON_COLORS,
				{ includeFallbackColors: true, level: 'AA', size: 'large' }
			).toHexString(),
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
 * @param {string|BlockType} blockTypeOrName  Block type or name.
 *
 * @return {BlockType|undefined} Block type.
 */
export function normalizeBlockType( blockTypeOrName ) {
	if ( isString( blockTypeOrName ) ) {
		return getBlockType( blockTypeOrName );
	}

	return blockTypeOrName;
}
