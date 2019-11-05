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
 * The `edit` function describes the structure of your block in the context of
 * the editor. This represents what the editor will render when the block is
 * used.
 *
 * @callback FnEditBlock
 *
 * @param {WPBlockEditProps} props
 * @return {WPComponent}
 */

/**
 * The `save` function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized into
 * `post_content`.
 *
 * @callback FnSaveBlock
 *
 * @param {WPBlockSaveProps} props
 * @return {WPComponent}
 */

/**
 * @callback FnSetAttributes
 *
 * @param {WPBlockAttributes} attributes Attributes to set.
 * @return {void}
 */

/**
 * Defined behavior of a block type.
 *
 * @typedef {Object} WPBlock
 *
 * @property {WPBlockAttributes}     [attributes]  Attributes provide the
 *                                                 structured data needs of a
 *                                                 block. They can exist in
 *                                                 different forms when they are
 *                                                 serialized, but they are
 *                                                 declared together under a
 *                                                 common interface.
 * @property {WPBlockCategory}       category      Blocks are grouped into
 *                                                 categories to help users
 *                                                 browse and discover them.
 * @property {WPBlockDeprecation}    [deprecated]  Array of deprecation handlers
 *                                                 for the block.
 * @property {string}                [description] This is a short description
 *                                                 for your block, which can be
 *                                                 translated with our
 *                                                 translation functions.
 * @property {FnEditBlock}           [edit]        Component rendering an
 *                                                 element to manipulate the
 *                                                 attributes of a block in the
 *                                                 context of an editor.
 * @property {WPBlockTypeIconRender} [icon]        An icon property should be
 *                                                 specified to make it easier
 *                                                 to identify a block. These
 *                                                 can be any of the WordPress
 *                                                 Dashicons, or a custom `svg`
 *                                                 element.
 * @property {string[]}              [keywords]    Sometimes a block could have
 *                                                 aliases that help users
 *                                                 discover it while searching.
 *                                                 For example, an `image` block
 *                                                 could also want to be
 *                                                 discovered by `photo`. You
 *                                                 can do so by providing an
 *                                                 array of terms (which can be
 *                                                 translated).
 * @property {string[]}              [parent]      Setting `parent` lets a block
 *                                                 require that it is only
 *                                                 available when nested within
 *                                                 the specified blocks.
 * @property {FnSaveBlock}           save          Component describing
 *                                                 serialized markup structure
 *                                                 of a block type.
 * @property {WPBlockStyle[]}        [styles]      Block styles can be used to
 *                                                 provide alternative styles to
 *                                                 block. It works by adding a
 *                                                 class name to the block’s
 *                                                 wrapper. Using CSS, a theme
 *                                                 developer can target the
 *                                                 class name for the style
 *                                                 variation if it is selected.
 * @property {WPBlockSupports}       [supports]    Optional block extended
 *                                                 support features.
 * @property {string}                title         This is the display title for
 *                                                 your block, which can be
 *                                                 translated with our
 *                                                 translation functions. The
 *                                                 block inserter will show this
 *                                                 name.
 * @property {WPBlockTransforms}     [transforms]  Block transformations.
 */

/**
 * Editor block alignment options.
 *
 * @typedef {('left' | 'center' | 'right' | 'wide' | 'full')} WPBlockAlign
 */

/**
 * Editor block attributes object.
 *
 * @typedef {Object} WPBlockAttributeOptions
 *
 * @property {string}                 attribute Use attribute to extract the
 *                                              value of an attribute from
 *                                              markup.
 * @property {string}                 meta      Attributes may be obtained from
 *                                              a post’s meta rather than from
 *                                              the block’s representation in
 *                                              saved post content. For this, an
 *                                              attribute is required to specify
 *                                              its corresponding meta key under
 *                                              the meta key
 * @property {string}                 selector  A CSS selector used to parse the
 *                                              saved block's HTML. The selector
 *                                              specified can be an HTML tag, or
 *                                              anything queryable such as a
 *                                              `class` or `id` attribute.
 * @property {WPBlockAttributeSource} source    Attribute sources are used to
 *                                              define how the block attribute
 *                                              values are extracted from saved
 *                                              post content. They provide a
 *                                              mechanism to map from the saved
 *                                              markup to a JavaScript
 *                                              representation of a block.
 * @property {WPBlockAttributeType}   type      The type of the attribute.
 *
 * @example
 * ```js
 * {
 *     url: {
 *         type: 'string',
 *         source: 'attribute',
 *         selector: 'img',
 *         attribute: 'src',
 *     }
 * }
 * // { "url": "https://lorempixel.com/1200/800/" }
 * ```
 */

/**
 * Editor block category options.
 *
 * @typedef {Object<string, WPBlockAttributeOptions>} WPBlockAttributes
 */

/**
 * Editor block category options.
 *
 * @typedef {('text'|'html'|'query'|'meta'|'number'|'string'|'integer')} WPBlockAttributeSource
 */

/**
 * Editor block category options.
 *
 * @typedef {('null'|'boolean'|'object'|'array'|'number'|'string'|'integer')} WPBlockAttributeType
 */

/**
 * Editor block category options.
 *
 * @typedef {('common'|'formatting'|'layout'|'widgets'|'embed')} WPBlockCategory
 */

/**
 * @typedef {Object} WPBlockEditProps
 *
 * @property {WPBlockAttributes} attributes    This property surfaces all the
 *                                             available attributes and their
 *                                             corresponding values, as
 *                                             described by the attributes
 *                                             property when the block type was
 *                                             registered.
 * @property {string}            [className]   This property returns the class
 *                                             name for the wrapper element.
 *                                             This is automatically added in
 *                                             the `save` method, but not on
 *                                             `edit`, as the root element may
 *                                             not correspond to what is
 *                                             visually the main element of the
 *                                             block. You can request it to add
 *                                             it to the correct element in your
 *                                             function.
 * @property {boolean}           [isSelected]  The `isSelected` property is an
 *                                             object that communicates whether
 *                                             the block is currently selected.
 * @property {FnSetAttributes}   setAttributes This function allows the block to
 *                                             update individual attributes
 *                                             based on user interactions.
 */

/**
 *
 * @typedef {Object} WPBlockSaveProps
 *
 * @property {WPBlockAttributes} attributes As with edit, the save function also
 *                                          receives an object argument
 *                                          including attributes which can be
 *                                          inserted into the markup.
 */

/**
 * Editor block style object.
 *
 * @typedef {Object} WPBlockStyle
 *
 * @property {string}  name      Unique key name for the style definition.
 * @property {string}  label     Label shown to the user in the editor.
 * @property {boolean} isDefault Whether or not the style is selected by
 *                               default.
 */

/**
 * Editor block deprecation options.
 *
 * @typedef {Object} WPBlockDeprecation
 *
 * @property {WPBlockAttributes} attributes   The attributes definition of the
 *                                            deprecated form of the block.
 * @property {Function}          [isEligible] A function which, given the
 *                                            attributes and inner blocks of the
 *                                            parsed block, returns true if the
 *                                            deprecation can handle the block
 *                                            migration. This is particularly
 *                                            useful in cases where a block is
 *                                            technically valid even once
 *                                            deprecated, and requires updates
 *                                            to its attributes or inner blocks.
 * @property {Function}          [migrate]    A function which, given the old
 *                                            attributes and inner blocks is
 *                                            expected to return either the new
 *                                            attributes or a tuple array of
 *                                            `[attributes, innerBlocks]`
 *                                            compatible with the block.
 * @property {FnSaveBlock}       save         The save implementation of the
 *                                            deprecated form of the block.
 * @property {WPBlockSupports}   support      The supports definition of the
 *                                            deprecated form of the block.
 */

/**
 * Editor block category options.
 *
 * @typedef {Object} WPBlockSupports
 *
 *
 * @property {boolean | WPBlockAlign[]} [align]           This property adds block
 *                                                        controls which allow to change
 *                                                        block's alignment. Defaults to
 *                                                        `false`.
 * @property {boolean}                  [alignWide]       This property enables wide
 *                                                        alignment (depends on `align`).
 *                                                        Defaults to `true`.
 * @property {boolean}                  [anchor]          Anchors let you link directly to
 *                                                        a specific block on a page. This
 *                                                        property adds a field to define
 *                                                        an id for the block and a button
 *                                                        to copy the direct link.
 *                                                        Defaults to `false`.
 * @property {boolean}                  [customClassName] This property adds a field to
 *                                                        define a custom className for
 *                                                        the block's wrapper. Defaults to
 *                                                        `true`.
 * @property {boolean}                  [className]       This property adds a class with
 *                                                        the form
 *                                                        `.wp-block-your-block-name` to
 *                                                        the root element of your saved
 *                                                        markup. Defaults to `true`.
 * @property {boolean}                  [html]            This property allows a block's
 *                                                        markup to be edited
 *                                                        individually. Defaults to
 *                                                        `true`.
 * @property {boolean}                  [inserter]        By default, all blocks will
 *                                                        appear in the Gutenberg
 *                                                        inserter. To hide a block so
 *                                                        that it can only be inserted
 *                                                        programmatically, set this
 *                                                        property to `false`.
 * @property {boolean}                  [multiple]        A non-multiple block can be
 *                                                        inserted into each post, one
 *                                                        time only. Defaults to `true`.
 * @property {boolean}                  [reusable]        This property allows non-
 *                                                        multiple block to be converted
 *                                                        to a reusable block.. Defaults
 *                                                        to `true`.
 */

/**
 * Block transformations.
 *
 * @typedef {Object} WPBlockTransforms
 *
 * @property {Object<string,*>[]} from Transforms from another block type to
 *                                     this block type.
 * @property {Object<string,*>[]} to   Transforms from this block type to
 *                                     another block type.
 */

/**
 * Value to use to render the icon for a block type in an editor interface,
 * either a Dashicon slug, an element, a component, or an object describing
 * the icon.
 *
 * @typedef {(WPBlockTypeIconDescriptor|WPBlockTypeIconRender)} WPBlockTypeIcon
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
 * Render behavior of a block type icon; one of a Dashicon slug, an element,
 * or a component.
 *
 * @typedef {(string|WPElement|WPComponent)} WPBlockTypeIconRender
 *
 * @see https://developer.wordpress.org/resource/dashicons/
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
 * @param {string}  name     Block name.
 * @param {WPBlock} settings Block settings.
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
