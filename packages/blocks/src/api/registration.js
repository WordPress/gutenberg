/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
import {
	get,
	isFunction,
	isPlainObject,
	some,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isValidIcon, normalizeIconObject } from './utils';

/**
 * @typedef {import('@wordpress/blocks').Block<Record<string,any>>} BlockType
 */

/**
 * @typedef {import('@wordpress/blocks').BlockInstance<Record<string,any>>} BlockInstance
 */

/**
 * @template {Record<string,any>} T
 * @typedef {import('@wordpress/blocks').BlockConfiguration<T>} BlockConfiguration
 */

/**
 * @typedef {import('@wordpress/blocks').BlockSupports} BlockSupports
 */

/**
 * @typedef {import('@wordpress/blocks').BlockStyle} BlockStyle
 */
const DEFAULT_BLOCK_TYPE_SETTINGS = {
	icon: 'block-default',
	attributes: {},
	keywords: [],
	save: () => null,
};

let serverSideBlockDefinitions = {};

/**
 * Sets the server side block definition of blocks.
 *
 * @param {Object} definitions Server-side block definitions
 */
export function unstable__bootstrapServerSideBlockDefinitions( definitions ) { // eslint-disable-line camelcase
	serverSideBlockDefinitions = {
		...serverSideBlockDefinitions,
		...definitions,
	};
}

/**
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @template {Record<string,any>} T
 * @param {string}                name     Block name.
 * @param {BlockConfiguration<T>} settings Block settings.
 *
 * @return {BlockConfiguration<T>|undefined} The block, if it has been successfully registered;
 *                                           otherwise `undefined`.
 */
export function registerBlockType( name, settings ) {
	settings = {
		name,
		...DEFAULT_BLOCK_TYPE_SETTINGS,
		...get( serverSideBlockDefinitions, name ),
		...settings,
	};

	if ( typeof name !== 'string' ) {
		console.error(
			'Block names must be strings.'
		);
		return;
	}
	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
		);
		return;
	}
	if ( select( 'core/blocks' ).getBlockType( name ) ) {
		console.error(
			'Block "' + name + '" is already registered.'
		);
		return;
	}

	settings = applyFilters( 'blocks.registerBlockType', settings, name );

	if ( settings.deprecated ) {
		settings.deprecated = settings.deprecated.map( ( deprecation ) => applyFilters( 'blocks.registerBlockType', deprecation, name ) );
	}

	if ( ! isPlainObject( settings ) ) {
		console.error(
			'Block settings must be a valid object.'
		);
		return;
	}

	if ( ! isFunction( settings.save ) ) {
		console.error(
			'The "save" property must be a valid function.'
		);
		return;
	}
	if ( 'edit' in settings && ! isFunction( settings.edit ) ) {
		console.error(
			'The "edit" property must be a valid function.'
		);
		return;
	}
	if ( ! ( 'category' in settings ) ) {
		console.error(
			'The block "' + name + '" must have a category.'
		);
		return;
	}
	if (
		'category' in settings &&
		! some( select( 'core/blocks' ).getCategories(), { slug: settings.category } )
	) {
		console.error(
			'The block "' + name + '" must have a registered category.'
		);
		return;
	}
	if ( ! ( 'title' in settings ) || settings.title === '' ) {
		console.error(
			'The block "' + name + '" must have a title.'
		);
		return;
	}
	if ( typeof settings.title !== 'string' ) {
		console.error(
			'Block titles must be strings.'
		);
		return;
	}

	settings.icon = normalizeIconObject( settings.icon );
	if ( ! isValidIcon( settings.icon.src ) ) {
		console.error(
			'The icon passed is invalid. ' +
			'The icon should be a string, an element, a function, or an object following the specifications documented in https://developer.wordpress.org/block-editor/developers/block-api/block-registration/#icon-optional'
		);
		return;
	}

	dispatch( 'core/blocks' ).addBlockTypes( settings );

	return settings;
}

/**
 * Unregisters a block.
 *
 * @param {string} name Block name.
 *
 * @return {BlockType|undefined} The previous block value, if it has been successfully
 *                                unregistered; otherwise `undefined`.
 */
export function unregisterBlockType( name ) {
	const oldBlock = select( 'core/blocks' ).getBlockType( name );
	if ( ! oldBlock ) {
		console.error(
			'Block "' + name + '" is not registered.'
		);
		return;
	}
	dispatch( 'core/blocks' ).removeBlockTypes( name );
	return oldBlock;
}

/**
 * Assigns name of block for handling non-block content.
 *
 * @param {string} blockName Block name.
 */
export function setFreeformContentHandlerName( blockName ) {
	dispatch( 'core/blocks' ).setFreeformFallbackBlockName( blockName );
}

/**
 * Retrieves name of block handling non-block content, or undefined if no
 * handler has been defined.
 *
 * @return {string|undefined} Block name.
 */
export function getFreeformContentHandlerName() {
	return select( 'core/blocks' ).getFreeformFallbackBlockName();
}

/**
 * Retrieves name of block used for handling grouping interactions.
 *
 * @return {string|undefined} Block name.
 */
export function getGroupingBlockName() {
	return select( 'core/blocks' ).getGroupingBlockName();
}

/**
 * Assigns name of block handling unregistered block types.
 *
 * @param {string} blockName Block name.
 */
export function setUnregisteredTypeHandlerName( blockName ) {
	dispatch( 'core/blocks' ).setUnregisteredFallbackBlockName( blockName );
}

/**
 * Retrieves name of block handling unregistered block types, or undefined if no
 * handler has been defined.
 *
 * @return {string|undefined} Block name.
 */
export function getUnregisteredTypeHandlerName() {
	return select( 'core/blocks' ).getUnregisteredFallbackBlockName();
}

/**
 * Assigns the default block name.
 *
 * @param {string} name Block name.
 */
export function setDefaultBlockName( name ) {
	dispatch( 'core/blocks' ).setDefaultBlockName( name );
}

/**
 * Assigns name of block for handling block grouping interactions.
 *
 * @param {string} name Block name.
 */
export function setGroupingBlockName( name ) {
	dispatch( 'core/blocks' ).setGroupingBlockName( name );
}

/**
 * Retrieves the default block name.
 *
 * @return {string|undefined} Block name.
 */
export function getDefaultBlockName() {
	return select( 'core/blocks' ).getDefaultBlockName();
}

/**
 * Returns a registered block type.
 *
 * @param {string} name Block name.
 *
 * @return {BlockType|undefined} Block type.
 */
export function getBlockType( name ) {
	return select( 'core/blocks' ).getBlockType( name );
}

// eslint-disable-next-line valid-jsdoc
/**
 * Returns all registered blocks.
 *
 * @return {readonly BlockType[]} Block settings.
 */
export function getBlockTypes() {
	return select( 'core/blocks' ).getBlockTypes();
}

// eslint-disable-next-line valid-jsdoc
/**
 * Returns the block support value for a feature, if defined.
 *
 * @param {string|BlockType}    nameOrType        Block name or type object.
 * @param {keyof BlockSupports} feature           Feature to retrieve.
 * @param {any}                 [defaultSupports] Default value to return if not
 *                                                explicitly defined.
 *
 * @return {any} Block support value.
 */
export function getBlockSupport( nameOrType, feature, defaultSupports ) {
	return select( 'core/blocks' ).getBlockSupport( nameOrType, feature, defaultSupports );
}

// eslint-disable-next-line valid-jsdoc
/**
 * Returns true if the block defines support for a feature, or false otherwise.
 *
 * @param {string|BlockType}    nameOrType        Block name or type object.
 * @param {keyof BlockSupports} feature           Feature to test.
 * @param {boolean}             [defaultSupports] Whether feature is supported by default
 *                                                if not explicitly defined.
 *
 * @return {boolean} Whether block supports feature.
 */
export function hasBlockSupport( nameOrType, feature, defaultSupports ) {
	return select( 'core/blocks' ).hasBlockSupport( nameOrType, feature, defaultSupports );
}

/**
 * Determines whether or not the given block is a reusable block. This is a
 * special block type that is used to point to a global block stored via the
 * API.
 *
 * @param {BlockInstance|BlockType} blockOrType Block or Block Type to test.
 *
 * @return {boolean} Whether the given block is a reusable block.
 */
export function isReusableBlock( blockOrType ) {
	return blockOrType.name === 'core/block';
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {string} blockName Name of block (example: 'core/columns').
 *
 * @return {string[]} Array of child block names.
 */
export const getChildBlockNames = ( blockName ) => {
	return select( 'core/blocks' ).getChildBlockNames( blockName );
};

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {string} blockName Name of block (example: 'core/latest-posts').
 *
 * @return {boolean} True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = ( blockName ) => {
	return select( 'core/blocks' ).hasChildBlocks( blockName );
};

/**
 * Returns a boolean indicating if a block has at least one child block with inserter support.
 *
 * @param {string} blockName Block type name.
 *
 * @return {boolean} True if a block contains at least one child blocks with inserter support
 *                   and false otherwise.
 */
export const hasChildBlocksWithInserterSupport = ( blockName ) => {
	return select( 'core/blocks' ).hasChildBlocksWithInserterSupport( blockName );
};

/**
 * Registers a new block style variation for the given block.
 *
 * @param {string}     blockName      Name of block (example: 'core/paragraph').
 * @param {BlockStyle} styleVariation Object containing `name` which is the class
 *                                    name applied to the block and `label` which
 *                                    identifies the variation to the user.
 */
export const registerBlockStyle = ( blockName, styleVariation ) => {
	dispatch( 'core/blocks' ).addBlockStyles( blockName, styleVariation );
};

/**
 * Unregisters a block style variation for the given block.
 *
 * @param {string} blockName          Name of block (example: 'core/latest-posts').
 * @param {string} styleVariationName Name of class applied to the block.
 */
export const unregisterBlockStyle = ( blockName, styleVariationName ) => {
	dispatch( 'core/blocks' ).removeBlockStyles( blockName, styleVariationName );
};
