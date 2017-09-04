/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
import { get, isFunction, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { getCategories } from './categories';

/**
 * Block settings keyed by block name.
 *
 * @type {Object}
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
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @param  {string}   name     Block name
 * @param  {Object}   settings Block settings
 * @return {?WPBlock}          The block, if it has been successfully
 *                             registered; otherwise `undefined`.
 */
export function registerBlockType( name, settings ) {
	if ( typeof name !== 'string' ) {
		console.error(
			'Block names must be strings.'
		);
		return;
	}
	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( name ) ) {
		console.error(
			'Block names must contain a namespace prefix. Example: my-plugin/my-custom-block'
		);
		return;
	}
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
	if ( blocks[ name ] ) {
		console.error(
			'Block "' + name + '" is already registered.'
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

	const block = blocks[ name ] = {
		name,
		attributes: get( window._wpBlocksAttributes, name ),
		...settings,
	};

	return block;
}

/**
 * Unregisters a block.
 *
 * @param  {string}   name Block name
 * @return {?WPBlock}      The previous block value, if it has been
 *                         successfully unregistered; otherwise `undefined`.
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
 * @param {string} name Block name
 */
export function setUnknownTypeHandlerName( name ) {
	unknownTypeHandlerName = name;
}

/**
 * Retrieves name of block handling unknown block types, or undefined if no
 * handler has been defined.
 *
 * @return {?string} Blog name
 */
export function getUnknownTypeHandlerName() {
	return unknownTypeHandlerName;
}

/**
 * Assigns the default block name
 *
 * @param {string} name Block name
 */
export function setDefaultBlockName( name ) {
	defaultBlockName = name;
}

/**
 * Retrieves the default block name
 *
 * @return {?string} Blog name
 */
export function getDefaultBlockName() {
	return defaultBlockName;
}

/**
 * Returns a registered block type.
 *
 * @param  {string}  name Block name
 * @return {?Object}      Block type
 */
export function getBlockType( name ) {
	return blocks[ name ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings
 */
export function getBlockTypes() {
	return Object.values( blocks );
}
