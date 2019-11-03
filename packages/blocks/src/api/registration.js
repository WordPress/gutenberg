/* eslint no-console: [ 'error', { allow: [ 'error' ] } ] */

/**
 * External dependencies
 */
import {
	get,
	omit,
	pick,
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
import { DEPRECATED_ENTRY_KEYS } from './constants';

/**
 * TODO: Editor block attributes object.
 *
 * @typedef {Object} WPBlockAttributeOptions
 *
 * @property {WPBlockAttributeType} type ...
 * @property {string} source ...
 * @property {string} selector ...
 * @property {string} attribute ...
 * @property {string} meta Attributes may be obtained from a post’s meta rather than from the block’s representation in saved post content. For this, an attribute is required to specify its corresponding meta key under the meta key
 */

/**
 * Editor block category options.
 *
 * @typedef {Object.<string, WPBlockAttributeOptions>} WPBlockAttributes
 */

/**
 * TODO: Editor block style object.
 *
 * @typedef {Object} WPBlockStyle
 *
 * @property {string}  name      Unique key name for the style definition.
 * @property {string}  label     Label shown to the user in the editor.
 * @property {boolean} isDefault Whether or not the style is selected by
 *                               default.
 */

/**
 * Editor block category options.
 *
 * @typedef {('common'|'formatting'|'layout'|'widgets'|'embed')} WPBlockCategories
 */

/**
 * Editor block category options.
 *
 * @typedef {('null'|'boolean'|'object'|'array'|'number'|'string'|'integer')} WPBlockAttributeType
 */

/**
 * Editor block category options.
 *
 * @typedef {('text'|'html'|'query'|'meta'|'number'|'string'|'integer')} WPBlockAttributeSource
 */

/**
 * Editor block settings object.
 *
 * @typedef {Object} WPBlockSettings
 *
 * @property {string}                title        This is the display title for
 *                                                your block, which can be
 *                                                translated with our
 *                                                translation functions. The
 *                                                block inserter will show this
 *                                                name.
 * @property {WPBlockCategories}     [category]   Blocks are grouped into
 *                                                categories to help users
 *                                                browse and discover them.
 * @property {string[]}              [keywords]   Sometimes a block could have
 *                                                aliases that help users
 *                                                discover it while searching.
 *                                                For example, an `image` block
 *                                                could also want to be
 *                                                discovered by `photo`. You can
 *                                                do so by providing an array of
 *                                                terms (which can be
 *                                                translated).
 * @property {WPBlockTypeIconRender} [icon]       An icon property should be
 *                                                specified to make it easier to
 *                                                identify a block. These can be
 *                                                any of the WordPress
 *                                                Dashicons, or a custom `svg`
 *                                                element.
 * @property {WPBlockAttributes}     [attributes] Attributes provide the
 *                                                structured data needs of a
 *                                                block. They can exist in
 *                                                different forms when they are
 *                                                serialized, but they are
 *                                                declared together under a
 *                                                common interface.
 * @property {WPBlockStyle[]}        [style]      Block styles can be used to
 *                                                provide alternative styles to
 *                                                block. It works by adding a
 *                                                class name to the block’s
 *                                                wrapper. Using CSS, a theme
 *                                                developer can target the class
 *                                                name for the style variation
 *                                                if it is selected.
 * @property {Function}              edit         TODO: ...
 * @property {Function}              save         TODO: ...
 */

/**
 * Render behavior of a block type icon; one of a Dashicon slug, an element,
 * or a component.
 *
 * @typedef {(string|WPElement|WPComponent)} WPBlockTypeIconRender
 *
 * @see https://developer.wordpress.org/resource/dashicons/
 */

/**
 * An object describing a normalized block type icon.
 *
 * @typedef {Object} WPBlockTypeIconDescriptor
 *
 * @property {WPBlockTypeIconRender} src         Render behavior of the icon,
 *                                               one of a Dashicon slug, an
 *                                               element, or a component.
 * @property {string}                background  Optimal background hex string
 *                                               color when displaying icon.
 * @property {string}                foreground  Optimal foreground hex string
 *                                               color when displaying icon.
 * @property {string}                shadowColor Optimal shadow hex string
 *                                               color when displaying icon.
 */

/**
 * Value to use to render the icon for a block type in an editor interface,
 * either a Dashicon slug, an element, a component, or an object describing
 * the icon.
 *
 * @typedef {(WPBlockTypeIconDescriptor|WPBlockTypeIconRender)} WPBlockTypeIcon
 */

/**
 * Defined behavior of a block type.
 *
 * @typedef {Object} WPBlock
 *
 * @property {string}          name         Block type's namespaced name.
 * @property {string}          title        Human-readable block type label.
 * @property {string}          category     Block type category classification,
 *                                          used in search interfaces to arrange
 *                                          block types by category.
 * @property {WPBlockTypeIcon} [icon]       Block type icon.
 * @property {string[]}        [keywords]   Additional keywords to produce block
 *                                          type as result in search interfaces.
 * @property {Object}          [attributes] Block type attributes.
 * @property {WPComponent}     [save]       Optional component describing
 *                                          serialized markup structure of a
 *                                          block type.
 * @property {WPComponent}     edit         Component rendering an element to
 *                                          manipulate the attributes of a block
 *                                          in the context of an editor.
 */

/**
 * Default values to assign for omitted optional block type settings.
 *
 * @type {Object}
 */
export const DEFAULT_BLOCK_TYPE_SETTINGS = {
	icon: 'block-default',
	attributes: {},
	keywords: [],
	save: () => null,
};

export let serverSideBlockDefinitions = {};

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
 * @param {string}          name     Block name.
 * @param {WPBlockSettings} settings Block settings.
 *
 * @return {?WPBlock} The block, if it has been successfully registered;
 *                    otherwise `undefined`.
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

	const preFilterSettings = { ...settings };
	settings = applyFilters( 'blocks.registerBlockType', settings, name );

	if ( settings.deprecated ) {
		settings.deprecated = settings.deprecated.map( ( deprecation ) =>
			pick( // Only keep valid deprecation keys.
				applyFilters(
					'blocks.registerBlockType',
					// Merge deprecation keys with pre-filter settings
					// so that filters that depend on specific keys being
					// present don't fail.
					{
						// Omit deprecation keys here so that deprecations
						// can opt out of specific keys like "supports".
						...omit( preFilterSettings, DEPRECATED_ENTRY_KEYS ),
						...deprecation,
					},
					name
				),
				DEPRECATED_ENTRY_KEYS
			)
		);
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
 * @return {?WPBlock} The previous block value, if it has been successfully
 *                    unregistered; otherwise `undefined`.
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
 * @return {?string} Block name.
 */
export function getFreeformContentHandlerName() {
	return select( 'core/blocks' ).getFreeformFallbackBlockName();
}

/**
 * Retrieves name of block used for handling grouping interactions.
 *
 * @return {?string} Block name.
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
 * @return {?string} Block name.
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
 * @return {?string} Block name.
 */
export function getDefaultBlockName() {
	return select( 'core/blocks' ).getDefaultBlockName();
}

/**
 * Returns a registered block type.
 *
 * @param {string} name Block name.
 *
 * @return {?Object} Block type.
 */
export function getBlockType( name ) {
	return select( 'core/blocks' ).getBlockType( name );
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings.
 */
export function getBlockTypes() {
	return select( 'core/blocks' ).getBlockTypes();
}

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param  {(string|Object)} nameOrType      Block name or type object
 * @param  {string}          feature         Feature to retrieve
 * @param  {*}               defaultSupports Default value to return if not
 *                                           explicitly defined
 *
 * @return {?*} Block support value
 */
export function getBlockSupport( nameOrType, feature, defaultSupports ) {
	return select( 'core/blocks' ).getBlockSupport( nameOrType, feature, defaultSupports );
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
	return select( 'core/blocks' ).hasBlockSupport( nameOrType, feature, defaultSupports );
}

/**
 * Determines whether or not the given block is a reusable block. This is a
 * special block type that is used to point to a global block stored via the
 * API.
 *
 * @param {Object} blockOrType Block or Block Type to test.
 *
 * @return {boolean} Whether the given block is a reusable block.
 */
export function isReusableBlock( blockOrType ) {
	return blockOrType.name === 'core/block';
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {string} blockName Name of block (example: “latest-posts”).
 *
 * @return {Array} Array of child block names.
 */
export const getChildBlockNames = ( blockName ) => {
	return select( 'core/blocks' ).getChildBlockNames( blockName );
};

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {string} blockName Name of block (example: “latest-posts”).
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
 * @param {string} blockName      Name of block (example: “core/latest-posts”).
 * @param {Object} styleVariation Object containing `name` which is the class name applied to the block and `label` which identifies the variation to the user.
 */
export const registerBlockStyle = ( blockName, styleVariation ) => {
	dispatch( 'core/blocks' ).addBlockStyles( blockName, styleVariation );
};

/**
 * Unregisters a block style variation for the given block.
 *
 * @param {string} blockName          Name of block (example: “core/latest-posts”).
 * @param {string} styleVariationName Name of class applied to the block.
 */
export const unregisterBlockStyle = ( blockName, styleVariationName ) => {
	dispatch( 'core/blocks' ).removeBlockStyles( blockName, styleVariationName );
};
