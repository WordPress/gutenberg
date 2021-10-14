/* eslint no-console: [ 'error', { allow: [ 'error', 'warn' ] } ] */

/**
 * External dependencies
 */
import {
	camelCase,
	isArray,
	isEmpty,
	isNil,
	isObject,
	isString,
	mapKeys,
	pick,
	pickBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import i18nBlockSchema from './i18n-block.json';
import { BLOCK_ICON_DEFAULT } from './constants';
import { store as blocksStore } from '../store';

/**
 * An icon type definition. One of a Dashicon slug, an element,
 * or a component.
 *
 * @typedef {(string|WPElement|WPComponent)} WPIcon
 *
 * @see https://developer.wordpress.org/resource/dashicons/
 */

/**
 * Render behavior of a block type icon; one of a Dashicon slug, an element,
 * or a component.
 *
 * @typedef {WPIcon} WPBlockTypeIconRender
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
 * Named block variation scopes.
 *
 * @typedef {'block'|'inserter'|'transform'} WPBlockVariationScope
 */

/**
 * An object describing a variation defined for the block type.
 *
 * @typedef {Object} WPBlockVariation
 *
 * @property {string}                  name          The unique and machine-readable name.
 * @property {string}                  title         A human-readable variation title.
 * @property {string}                  [description] A detailed variation description.
 * @property {string}                  [category]    Block type category classification,
 *                                                   used in search interfaces to arrange
 *                                                   block types by category.
 * @property {WPIcon}                  [icon]        An icon helping to visualize the variation.
 * @property {boolean}                 [isDefault]   Indicates whether the current variation is
 *                                                   the default one. Defaults to `false`.
 * @property {Object}                  [attributes]  Values which override block attributes.
 * @property {Array[]}                 [innerBlocks] Initial configuration of nested blocks.
 * @property {Object}                  [example]     Example provides structured data for
 *                                                   the block preview. You can set to
 *                                                   `undefined` to disable the preview shown
 *                                                   for the block type.
 * @property {WPBlockVariationScope[]} [scope]       The list of scopes where the variation
 *                                                   is applicable. When not provided, it
 *                                                   assumes all available scopes.
 * @property {string[]}                [keywords]    An array of terms (which can be translated)
 *                                                   that help users discover the variation
 *                                                   while searching.
 * @property {Function|string[]}       [isActive]    This can be a function or an array of block attributes.
 *                                                   Function that accepts a block's attributes and the
 *                                                   variation's attributes and determines if a variation is active.
 *                                                   This function doesn't try to find a match dynamically based
 *                                                   on all block's attributes, as in many cases some attributes are irrelevant.
 *                                                   An example would be for `embed` block where we only care
 *                                                   about `providerNameSlug` attribute's value.
 *                                                   We can also use a `string[]` to tell which attributes
 *                                                   should be compared as a shorthand. Each attributes will
 *                                                   be matched and the variation will be active if all of them are matching.
 */

/**
 * Defined behavior of a block type.
 *
 * @typedef {Object} WPBlockType
 *
 * @property {string}             name          Block type's namespaced name.
 * @property {string}             title         Human-readable block type label.
 * @property {string}             [description] A detailed block type description.
 * @property {string}             [category]    Block type category classification,
 *                                              used in search interfaces to arrange
 *                                              block types by category.
 * @property {WPBlockTypeIcon}    [icon]        Block type icon.
 * @property {string[]}           [keywords]    Additional keywords to produce block
 *                                              type as result in search interfaces.
 * @property {Object}             [attributes]  Block type attributes.
 * @property {WPComponent}        [save]        Optional component describing
 *                                              serialized markup structure of a
 *                                              block type.
 * @property {WPComponent}        edit          Component rendering an element to
 *                                              manipulate the attributes of a block
 *                                              in the context of an editor.
 * @property {WPBlockVariation[]} [variations]  The list of block variations.
 * @property {Object}             [example]     Example provides structured data for
 *                                              the block preview. When not defined
 *                                              then no preview is shown.
 */

export const serverSideBlockDefinitions = {};

/**
 * Sets the server side block definition of blocks.
 *
 * @param {Object} definitions Server-side block definitions
 */
// eslint-disable-next-line camelcase
export function unstable__bootstrapServerSideBlockDefinitions( definitions ) {
	for ( const blockName of Object.keys( definitions ) ) {
		// Don't overwrite if already set. It covers the case when metadata
		// was initialized from the server.
		if ( serverSideBlockDefinitions[ blockName ] ) {
			// We still need to polyfill `apiVersion` for WordPress version
			// lower than 5.7. If it isn't present in the definition shared
			// from the server, we try to fallback to the definition passed.
			// @see https://github.com/WordPress/gutenberg/pull/29279
			if (
				serverSideBlockDefinitions[ blockName ].apiVersion ===
					undefined &&
				definitions[ blockName ].apiVersion
			) {
				serverSideBlockDefinitions[ blockName ].apiVersion =
					definitions[ blockName ].apiVersion;
			}
			continue;
		}
		serverSideBlockDefinitions[ blockName ] = mapKeys(
			pickBy( definitions[ blockName ], ( value ) => ! isNil( value ) ),
			( value, key ) => camelCase( key )
		);
	}
}

/**
 * Gets block settings from metadata loaded from `block.json` file.
 *
 * @param {Object} metadata            Block metadata loaded from `block.json`.
 * @param {string} metadata.textdomain Textdomain to use with translations.
 *
 * @return {Object} Block settings.
 */
function getBlockSettingsFromMetadata( { textdomain, ...metadata } ) {
	const allowedFields = [
		'apiVersion',
		'title',
		'category',
		'parent',
		'icon',
		'description',
		'keywords',
		'attributes',
		'providesContext',
		'usesContext',
		'supports',
		'styles',
		'example',
		'variations',
	];

	const settings = pick( metadata, allowedFields );

	if ( textdomain ) {
		Object.keys( i18nBlockSchema ).forEach( ( key ) => {
			if ( ! settings[ key ] ) {
				return;
			}
			settings[ key ] = translateBlockSettingUsingI18nSchema(
				i18nBlockSchema[ key ],
				settings[ key ],
				textdomain
			);
		} );
	}

	return settings;
}

/**
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * @param {string|Object} blockNameOrMetadata Block type name or its metadata.
 * @param {Object}        settings            Block settings.
 *
 * @return {?WPBlockType} The block, if it has been successfully registered;
 *                    otherwise `undefined`.
 */
export function registerBlockType( blockNameOrMetadata, settings ) {
	const name = isObject( blockNameOrMetadata )
		? blockNameOrMetadata.name
		: blockNameOrMetadata;

	if ( typeof name !== 'string' ) {
		console.error( 'Block names must be strings.' );
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		console.error(
			'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
		);
		return;
	}
	if ( select( blocksStore ).getBlockType( name ) ) {
		console.error( 'Block "' + name + '" is already registered.' );
		return;
	}

	if ( isObject( blockNameOrMetadata ) ) {
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: getBlockSettingsFromMetadata( blockNameOrMetadata ),
		} );
	}

	const blockType = {
		name,
		icon: BLOCK_ICON_DEFAULT,
		keywords: [],
		attributes: {},
		providesContext: {},
		usesContext: [],
		supports: {},
		styles: [],
		variations: [],
		save: () => null,
		...serverSideBlockDefinitions?.[ name ],
		...settings,
	};

	dispatch( blocksStore ).__experimentalRegisterBlockType( blockType );

	return select( blocksStore ).getBlockType( name );
}

/**
 * Translates block settings provided with metadata using the i18n schema.
 *
 * @param {string|string[]|Object[]} i18nSchema   I18n schema for the block setting.
 * @param {string|string[]|Object[]} settingValue Value for the block setting.
 * @param {string}                   textdomain   Textdomain to use with translations.
 *
 * @return {string|string[]|Object[]} Translated setting.
 */
function translateBlockSettingUsingI18nSchema(
	i18nSchema,
	settingValue,
	textdomain
) {
	if ( isString( i18nSchema ) && isString( settingValue ) ) {
		// eslint-disable-next-line @wordpress/i18n-no-variables, @wordpress/i18n-text-domain
		return _x( settingValue, i18nSchema, textdomain );
	}
	if (
		isArray( i18nSchema ) &&
		! isEmpty( i18nSchema ) &&
		isArray( settingValue )
	) {
		return settingValue.map( ( value ) =>
			translateBlockSettingUsingI18nSchema(
				i18nSchema[ 0 ],
				value,
				textdomain
			)
		);
	}
	if (
		isObject( i18nSchema ) &&
		! isEmpty( i18nSchema ) &&
		isObject( settingValue )
	) {
		return Object.keys( settingValue ).reduce( ( accumulator, key ) => {
			if ( ! i18nSchema[ key ] ) {
				accumulator[ key ] = settingValue[ key ];
				return accumulator;
			}
			accumulator[ key ] = translateBlockSettingUsingI18nSchema(
				i18nSchema[ key ],
				settingValue[ key ],
				textdomain
			);
			return accumulator;
		}, {} );
	}
	return settingValue;
}

/**
 * Registers a new block collection to group blocks in the same namespace in the inserter.
 *
 * @param {string} namespace       The namespace to group blocks by in the inserter; corresponds to the block namespace.
 * @param {Object} settings        The block collection settings.
 * @param {string} settings.title  The title to display in the block inserter.
 * @param {Object} [settings.icon] The icon to display in the block inserter.
 */
export function registerBlockCollection( namespace, { title, icon } ) {
	dispatch( blocksStore ).addBlockCollection( namespace, title, icon );
}

/**
 * Unregisters a block collection
 *
 * @param {string} namespace The namespace to group blocks by in the inserter; corresponds to the block namespace
 *
 */
export function unregisterBlockCollection( namespace ) {
	dispatch( blocksStore ).removeBlockCollection( namespace );
}

/**
 * Unregisters a block.
 *
 * @param {string} name Block name.
 *
 * @return {?WPBlockType} The previous block value, if it has been successfully
 *                    unregistered; otherwise `undefined`.
 */
export function unregisterBlockType( name ) {
	const oldBlock = select( blocksStore ).getBlockType( name );
	if ( ! oldBlock ) {
		console.error( 'Block "' + name + '" is not registered.' );
		return;
	}
	dispatch( blocksStore ).removeBlockTypes( name );
	return oldBlock;
}

/**
 * Assigns name of block for handling non-block content.
 *
 * @param {string} blockName Block name.
 */
export function setFreeformContentHandlerName( blockName ) {
	dispatch( blocksStore ).setFreeformFallbackBlockName( blockName );
}

/**
 * Retrieves name of block handling non-block content, or undefined if no
 * handler has been defined.
 *
 * @return {?string} Block name.
 */
export function getFreeformContentHandlerName() {
	return select( blocksStore ).getFreeformFallbackBlockName();
}

/**
 * Retrieves name of block used for handling grouping interactions.
 *
 * @return {?string} Block name.
 */
export function getGroupingBlockName() {
	return select( blocksStore ).getGroupingBlockName();
}

/**
 * Assigns name of block handling unregistered block types.
 *
 * @param {string} blockName Block name.
 */
export function setUnregisteredTypeHandlerName( blockName ) {
	dispatch( blocksStore ).setUnregisteredFallbackBlockName( blockName );
}

/**
 * Retrieves name of block handling unregistered block types, or undefined if no
 * handler has been defined.
 *
 * @return {?string} Block name.
 */
export function getUnregisteredTypeHandlerName() {
	return select( blocksStore ).getUnregisteredFallbackBlockName();
}

/**
 * Assigns the default block name.
 *
 * @param {string} name Block name.
 */
export function setDefaultBlockName( name ) {
	dispatch( blocksStore ).setDefaultBlockName( name );
}

/**
 * Assigns name of block for handling block grouping interactions.
 *
 * @param {string} name Block name.
 */
export function setGroupingBlockName( name ) {
	dispatch( blocksStore ).setGroupingBlockName( name );
}

/**
 * Retrieves the default block name.
 *
 * @return {?string} Block name.
 */
export function getDefaultBlockName() {
	return select( blocksStore ).getDefaultBlockName();
}

/**
 * Returns a registered block type.
 *
 * @param {string} name Block name.
 *
 * @return {?Object} Block type.
 */
export function getBlockType( name ) {
	return select( blocksStore )?.getBlockType( name );
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings.
 */
export function getBlockTypes() {
	return select( blocksStore ).getBlockTypes();
}

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param {(string|Object)} nameOrType      Block name or type object
 * @param {string}          feature         Feature to retrieve
 * @param {*}               defaultSupports Default value to return if not
 *                                          explicitly defined
 *
 * @return {?*} Block support value
 */
export function getBlockSupport( nameOrType, feature, defaultSupports ) {
	return select( blocksStore ).getBlockSupport(
		nameOrType,
		feature,
		defaultSupports
	);
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
	return select( blocksStore ).hasBlockSupport(
		nameOrType,
		feature,
		defaultSupports
	);
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
	return blockOrType?.name === 'core/block';
}

/**
 * Determines whether or not the given block is a template part. This is a
 * special block type that allows composing a page template out of reusable
 * design elements.
 *
 * @param {Object} blockOrType Block or Block Type to test.
 *
 * @return {boolean} Whether the given block is a template part.
 */
export function isTemplatePart( blockOrType ) {
	return blockOrType.name === 'core/template-part';
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param {string} blockName Name of block (example: “latest-posts”).
 *
 * @return {Array} Array of child block names.
 */
export const getChildBlockNames = ( blockName ) => {
	return select( blocksStore ).getChildBlockNames( blockName );
};

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param {string} blockName Name of block (example: “latest-posts”).
 *
 * @return {boolean} True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = ( blockName ) => {
	return select( blocksStore ).hasChildBlocks( blockName );
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
	return select( blocksStore ).hasChildBlocksWithInserterSupport( blockName );
};

/**
 * Registers a new block style variation for the given block.
 *
 * @param {string} blockName      Name of block (example: “core/latest-posts”).
 * @param {Object} styleVariation Object containing `name` which is the class name applied to the block and `label` which identifies the variation to the user.
 */
export const registerBlockStyle = ( blockName, styleVariation ) => {
	dispatch( blocksStore ).addBlockStyles( blockName, styleVariation );
};

/**
 * Unregisters a block style variation for the given block.
 *
 * @param {string} blockName          Name of block (example: “core/latest-posts”).
 * @param {string} styleVariationName Name of class applied to the block.
 */
export const unregisterBlockStyle = ( blockName, styleVariationName ) => {
	dispatch( blocksStore ).removeBlockStyles( blockName, styleVariationName );
};

/**
 * Returns an array with the variations of a given block type.
 *
 * @param {string}                blockName Name of block (example: “core/columns”).
 * @param {WPBlockVariationScope} [scope]   Block variation scope name.
 *
 * @return {(WPBlockVariation[]|void)} Block variations.
 */
export const getBlockVariations = ( blockName, scope ) => {
	return select( blocksStore ).getBlockVariations( blockName, scope );
};

/**
 * Registers a new block variation for the given block type.
 *
 * @param {string}           blockName Name of the block (example: “core/columns”).
 * @param {WPBlockVariation} variation Object describing a block variation.
 */
export const registerBlockVariation = ( blockName, variation ) => {
	dispatch( blocksStore ).addBlockVariations( blockName, variation );
};

/**
 * Unregisters a block variation defined for the given block type.
 *
 * @param {string} blockName     Name of the block (example: “core/columns”).
 * @param {string} variationName Name of the variation defined for the block.
 */
export const unregisterBlockVariation = ( blockName, variationName ) => {
	dispatch( blocksStore ).removeBlockVariations( blockName, variationName );
};
