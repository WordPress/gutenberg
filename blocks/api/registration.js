/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
import { get, isFunction, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getCategories } from './categories';

/**
 * Defined behavior of a block type.
 *
 * @typedef {WPBlockType}
 *
 * @property {string}             name       Block's namespaced name.
 * @property {string}             title      Human-readable label for a block.
 *                                           Shown in the block inserter.
 * @property {string}             category   Category classification of block,
 *                                           impacting where block is shown in
 *                                           inserter results.
 * @property {(string|WPElement)} icon       Slug of the Dashicon to be shown
 *                                           as the icon for the block in the
 *                                           inserter, or element.
 * @property {?string[]}          keywords   Additional keywords to produce
 *                                           block as inserter search result.
 * @property {?Object}            attributes Block attributes.
 * @property {Function}           save       Serialize behavior of a block,
 *                                           returning an element describing
 *                                           structure of the block's post
 *                                           content markup.
 * @property {WPComponent}        edit       Component rendering element to be
 *                                           interacted with in an editor.
 */

/**
 * Block type definitions keyed by block name.
 *
 * @type {Object.<string,WPBlockType>}
 */
const blocks = {};

const categories = getCategories();

/**
 * Name of block handling unknown types.
 *
 * @type {?string}
 */
let unknownTypeHandlerName;

/**
 * Name of the default block.
 *
 * @type {?string}
 */
let defaultBlockName;

/**
 * Constant mapping post formats to the expected default block.
 *
 * @type {Object}
 */
const POST_FORMAT_BLOCK_MAP = {
	audio: 'core/audio',
	gallery: 'core/gallery',
	image: 'core/image',
	quote: 'core/quote',
	video: 'core/video',
};

/**
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @param {string} name     Block name.
 * @param {Object} settings Block settings.
 *
 * @return {?WPBlock} The block, if it has been successfully registered;
 *                     otherwise `undefined`.
 */
export function registerBlockType( name, settings ) {
	settings = {
		name,
		...get( window._wpBlocks, name ),
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
	if ( blocks[ name ] ) {
		console.error(
			'Block "' + name + '" is already registered.'
		);
		return;
	}

	settings = applyFilters( 'blocks.registerBlockType', settings, name );

	if ( ! settings || ! isFunction( settings.save ) ) {
		console.error(
			'The "save" property must be specified and must be a valid function.'
		);
		return;
	}
	if ( 'edit' in settings && ! isFunction( settings.edit ) ) {
		console.error(
			'The "edit" property must be a valid function.'
		);
		return;
	}
	if ( 'keywords' in settings && settings.keywords.length > 3 ) {
		console.error(
			'The block "' + name + '" can have a maximum of 3 keywords.'
		);
		return;
	}
	if ( ! ( 'category' in settings ) ) {
		console.error(
			'The block "' + name + '" must have a category.'
		);
		return;
	}
	if ( 'category' in settings && ! some( categories, { slug: settings.category } ) ) {
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
	if ( ! settings.icon ) {
		settings.icon = 'block-default';
	}

	return blocks[ name ] = settings;
}

/**
 * Unregisters a block.
 *
 * @param {string} name Block name.
 *
 * @return {?WPBlock} The previous block value, if it has been successfully
 *                     unregistered; otherwise `undefined`.
 */
export function unregisterBlockType( name ) {
	if ( ! blocks[ name ] ) {
		console.error(
			'Block "' + name + '" is not registered.'
		);
		return;
	}
	const oldBlock = blocks[ name ];
	delete blocks[ name ];
	return oldBlock;
}

/**
 * Assigns name of block handling unknown block types.
 *
 * @param {string} name Block name.
 */
export function setUnknownTypeHandlerName( name ) {
	unknownTypeHandlerName = name;
}

/**
 * Retrieves name of block handling unknown block types, or undefined if no
 * handler has been defined.
 *
 * @return {?string} Blog name.
 */
export function getUnknownTypeHandlerName() {
	return unknownTypeHandlerName;
}

/**
 * Assigns the default block name.
 *
 * @param {string} name Block name.
 */
export function setDefaultBlockName( name ) {
	defaultBlockName = name;
}

/**
 * Retrieves the default block name.
 *
 * @return {?string} Block name.
 */
export function getDefaultBlockName() {
	return defaultBlockName;
}

/**
 * Retrieves the expected default block for the post format.
 *
 * @param	{string} postFormat Post format
 * @return {string}            Block name.
 */
export function getDefaultBlockForPostFormat( postFormat ) {
	const blockName = POST_FORMAT_BLOCK_MAP[ postFormat ];
	if ( blockName && getBlockType( blockName ) ) {
		return blockName;
	}
	return null;
}

/**
 * Returns a registered block type.
 *
 * @param {string} name Block name.
 *
 * @return {?Object} Block type.
 */
export function getBlockType( name ) {
	return blocks[ name ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings.
 */
export function getBlockTypes() {
	return Object.values( blocks );
}

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param  {(string|Object)} nameOrType      Block name or type object
 * @param  {string}          feature         Feature to retrieve
 * @param  {*}               defaultSupports Default value to return if not
 *                                           explicitly defined
 * @return {?*}                              Block support value
 */
export function getBlockSupport( nameOrType, feature, defaultSupports ) {
	const blockType = 'string' === typeof nameOrType ?
		getBlockType( nameOrType ) :
		nameOrType;

	return get( blockType, [
		'supports',
		feature,
	], defaultSupports );
}

/**
 * Returns true if the block defines support for a feature, or false otherwise.
 *
 * @param {(string|Object)} nameOrType      Block name or type object.
 * @param {string}          feature         Feature to test.
 * @param {boolean}         defaultSupports Whether feature is supported by
 *                                          default if not explicitly defined.
 *
 * @return {boolean} Whether block supports feature.
 */
export function hasBlockSupport( nameOrType, feature, defaultSupports ) {
	return !! getBlockSupport( nameOrType, feature, defaultSupports );
}

/**
 * Determines whether or not the given block is a shared block. This is a
 * special block type that is used to point to a global block stored via the
 * API.
 *
 * @param {Object} blockOrType Block or Block Type to test.
 *
 * @return {boolean} Whether the given block is a shared block.
 */
export function isSharedBlock( blockOrType ) {
	return blockOrType.name === 'core/block';
}
