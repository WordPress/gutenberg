/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { _x } from '@wordpress/i18n';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import i18nBlockSchema from './i18n-block.json';
import { store as blocksStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * An icon type definition. One of a Dashicon slug, an element,
 * or a component.
 *
 * @typedef {(string|Element|Component)} WPIcon
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
 * @property {Component}          [save]        Optional component describing
 *                                              serialized markup structure of a
 *                                              block type.
 * @property {Component}          edit          Component rendering an element to
 *                                              manipulate the attributes of a block
 *                                              in the context of an editor.
 * @property {WPBlockVariation[]} [variations]  The list of block variations.
 * @property {Object}             [example]     Example provides structured data for
 *                                              the block preview. When not defined
 *                                              then no preview is shown.
 */

function isObject( object ) {
	return object !== null && typeof object === 'object';
}

/**
 * Sets the server side block definition of blocks.
 *
 * Ignored from documentation due to being marked as unstable.
 *
 * @ignore
 *
 * @param {Object} definitions Server-side block definitions
 */
// eslint-disable-next-line camelcase
export function unstable__bootstrapServerSideBlockDefinitions( definitions ) {
	const { addBootstrappedBlockType } = unlock( dispatch( blocksStore ) );
	for ( const [ name, blockType ] of Object.entries( definitions ) ) {
		addBootstrappedBlockType( name, blockType );
	}
}

/**
 * Gets block settings from metadata loaded from `block.json` file
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
		'ancestor',
		'icon',
		'description',
		'keywords',
		'attributes',
		'providesContext',
		'usesContext',
		'selectors',
		'supports',
		'styles',
		'example',
		'variations',
		'blockHooks',
		'allowedBlocks',
	];

	const settings = Object.fromEntries(
		Object.entries( metadata ).filter( ( [ key ] ) =>
			allowedFields.includes( key )
		)
	);

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
 * For more in-depth information on registering a custom block see the
 * [Create a block tutorial](https://developer.wordpress.org/block-editor/getting-started/create-block/).
 *
 * @param {string|Object} blockNameOrMetadata Block type name or its metadata.
 * @param {Object}        settings            Block settings.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { registerBlockType } from '@wordpress/blocks'
 *
 * registerBlockType( 'namespace/block-name', {
 *     title: __( 'My First Block' ),
 *     edit: () => <div>{ __( 'Hello from the editor!' ) }</div>,
 *     save: () => <div>Hello from the saved content!</div>,
 * } );
 * ```
 *
 * @return {WPBlockType | undefined} The block, if it has been successfully registered;
 *                    otherwise `undefined`.
 */
export function registerBlockType( blockNameOrMetadata, settings ) {
	const name = isObject( blockNameOrMetadata )
		? blockNameOrMetadata.name
		: blockNameOrMetadata;

	if ( typeof name !== 'string' ) {
		warning( 'Block names must be strings.' );
		return;
	}

	if ( ! /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test( name ) ) {
		warning(
			'Block names must contain a namespace prefix, include only lowercase alphanumeric characters or dashes, and start with a letter. Example: my-plugin/my-custom-block'
		);
		return;
	}
	if ( select( blocksStore ).getBlockType( name ) ) {
		warning( 'Block "' + name + '" is already registered.' );
		return;
	}

	const { addBootstrappedBlockType, addUnprocessedBlockType } = unlock(
		dispatch( blocksStore )
	);

	if ( isObject( blockNameOrMetadata ) ) {
		const metadata = getBlockSettingsFromMetadata( blockNameOrMetadata );
		addBootstrappedBlockType( name, metadata );
	}

	addUnprocessedBlockType( name, settings );

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
	if ( typeof i18nSchema === 'string' && typeof settingValue === 'string' ) {
		// eslint-disable-next-line @wordpress/i18n-no-variables, @wordpress/i18n-text-domain
		return _x( settingValue, i18nSchema, textdomain );
	}
	if (
		Array.isArray( i18nSchema ) &&
		i18nSchema.length &&
		Array.isArray( settingValue )
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
		Object.entries( i18nSchema ).length &&
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
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { registerBlockCollection, registerBlockType } from '@wordpress/blocks';
 *
 * // Register the collection.
 * registerBlockCollection( 'my-collection', {
 *     title: __( 'Custom Collection' ),
 * } );
 *
 * // Register a block in the same namespace to add it to the collection.
 * registerBlockType( 'my-collection/block-name', {
 *     title: __( 'My First Block' ),
 *     edit: () => <div>{ __( 'Hello from the editor!' ) }</div>,
 *     save: () => <div>'Hello from the saved content!</div>,
 * } );
 * ```
 */
export function registerBlockCollection( namespace, { title, icon } ) {
	dispatch( blocksStore ).addBlockCollection( namespace, title, icon );
}

/**
 * Unregisters a block collection
 *
 * @param {string} namespace The namespace to group blocks by in the inserter; corresponds to the block namespace
 *
 * @example
 * ```js
 * import { unregisterBlockCollection } from '@wordpress/blocks';
 *
 * unregisterBlockCollection( 'my-collection' );
 * ```
 */
export function unregisterBlockCollection( namespace ) {
	dispatch( blocksStore ).removeBlockCollection( namespace );
}

/**
 * Unregisters a block.
 *
 * @param {string} name Block name.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { unregisterBlockType } from '@wordpress/blocks';
 *
 * const ExampleComponent = () => {
 *     return (
 *         <Button
 *             onClick={ () =>
 *                 unregisterBlockType( 'my-collection/block-name' )
 *             }
 *         >
 *             { __( 'Unregister my custom block.' ) }
 *         </Button>
 *     );
 * };
 * ```
 *
 * @return {WPBlockType | undefined} The previous block value, if it has been successfully
 *                    unregistered; otherwise `undefined`.
 */
export function unregisterBlockType( name ) {
	const oldBlock = select( blocksStore ).getBlockType( name );
	if ( ! oldBlock ) {
		warning( 'Block "' + name + '" is not registered.' );
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
 *
 * @example
 * ```js
 * import { setDefaultBlockName } from '@wordpress/blocks';
 *
 * const ExampleComponent = () => {
 *
 *     return (
 *         <Button onClick={ () => setDefaultBlockName( 'core/heading' ) }>
 *             { __( 'Set the default block to Heading' ) }
 *         </Button>
 *     );
 * };
 * ```
 */
export function setDefaultBlockName( name ) {
	dispatch( blocksStore ).setDefaultBlockName( name );
}

/**
 * Assigns name of block for handling block grouping interactions.
 *
 * This function lets you select a different block to group other blocks in instead of the
 * default `core/group` block. This function must be used in a component or when the DOM is fully
 * loaded. See https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dom-ready/
 *
 * @param {string} name Block name.
 *
 * @example
 * ```js
 * import { setGroupingBlockName } from '@wordpress/blocks';
 *
 * const ExampleComponent = () => {
 *
 *     return (
 *         <Button onClick={ () => setGroupingBlockName( 'core/columns' ) }>
 *             { __( 'Wrap in columns' ) }
 *         </Button>
 *     );
 * };
 * ```
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
	return blockOrType?.name === 'core/template-part';
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
 * Registers a new block style for the given block types.
 *
 * For more information on connecting the styles with CSS
 * [the official documentation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/#styles).
 *
 * @param {string|Array} blockNames     Name of blocks e.g. “core/latest-posts” or `["core/group", "core/columns"]`.
 * @param {Object}       styleVariation Object containing `name` which is the class name applied to the block and `label` which identifies the variation to the user.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { registerBlockStyle } from '@wordpress/blocks';
 * import { Button } from '@wordpress/components';
 *
 *
 * const ExampleComponent = () => {
 *     return (
 *         <Button
 *             onClick={ () => {
 *                 registerBlockStyle( 'core/quote', {
 *                     name: 'fancy-quote',
 *                     label: __( 'Fancy Quote' ),
 *                 } );
 *             } }
 *         >
 *             { __( 'Add a new block style for core/quote' ) }
 *         </Button>
 *     );
 * };
 * ```
 */
export const registerBlockStyle = ( blockNames, styleVariation ) => {
	dispatch( blocksStore ).addBlockStyles( blockNames, styleVariation );
};

/**
 * Unregisters a block style for the given block.
 *
 * @param {string} blockName          Name of block (example: “core/latest-posts”).
 * @param {string} styleVariationName Name of class applied to the block.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { unregisterBlockStyle } from '@wordpress/blocks';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     return (
 *     <Button
 *         onClick={ () => {
 *             unregisterBlockStyle( 'core/quote', 'plain' );
 *         } }
 *     >
 *         { __( 'Remove the "Plain" block style for core/quote' ) }
 *     </Button>
 *     );
 * };
 * ```
 */
export const unregisterBlockStyle = ( blockName, styleVariationName ) => {
	dispatch( blocksStore ).removeBlockStyles( blockName, styleVariationName );
};

/**
 * Returns an array with the variations of a given block type.
 * Ignored from documentation as the recommended usage is via useSelect from @wordpress/data.
 *
 * @ignore
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
 * For more information on block variations see
 * [the official documentation ](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/).
 *
 * @param {string}           blockName Name of the block (example: “core/columns”).
 * @param {WPBlockVariation} variation Object describing a block variation.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { registerBlockVariation } from '@wordpress/blocks';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     return (
 *         <Button
 *             onClick={ () => {
 *                 registerBlockVariation( 'core/embed', {
 *                     name: 'custom',
 *                     title: __( 'My Custom Embed' ),
 *                     attributes: { providerNameSlug: 'custom' },
 *                 } );
 *             } }
 *          >
 *              __( 'Add a custom variation for core/embed' ) }
 *         </Button>
 *     );
 * };
 * ```
 */
export const registerBlockVariation = ( blockName, variation ) => {
	if ( typeof variation.name !== 'string' ) {
		warning( 'Variation names must be unique strings.' );
	}

	dispatch( blocksStore ).addBlockVariations( blockName, variation );
};

/**
 * Unregisters a block variation defined for the given block type.
 *
 * @param {string} blockName     Name of the block (example: “core/columns”).
 * @param {string} variationName Name of the variation defined for the block.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { unregisterBlockVariation } from '@wordpress/blocks';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *     return (
 *         <Button
 *             onClick={ () => {
 *                 unregisterBlockVariation( 'core/embed', 'youtube' );
 *             } }
 *         >
 *             { __( 'Remove the YouTube variation from core/embed' ) }
 *         </Button>
 *     );
 * };
 * ```
 */
export const unregisterBlockVariation = ( blockName, variationName ) => {
	dispatch( blocksStore ).removeBlockVariations( blockName, variationName );
};

/**
 * Registers a new block bindings source with an object defining its
 * behavior. Once registered, the source is available to be connected
 * to the supported block attributes.
 *
 * @param {Object}   source                    Properties of the source to be registered.
 * @param {string}   source.name               The unique and machine-readable name.
 * @param {string}   [source.label]            Human-readable label.
 * @param {Array}    [source.usesContext]      Array of context needed by the source only in the editor.
 * @param {Function} [source.getValues]        Function to get the values from the source.
 * @param {Function} [source.setValues]        Function to update multiple values connected to the source.
 * @param {Function} [source.getPlaceholder]   Function to get the placeholder when the value is undefined.
 * @param {Function} [source.canUserEditValue] Function to determine if the user can edit the value.
 * @param {Function} [source.getFieldsList]    Function to get the lists of fields to expose in the connections panel.
 *
 * @example
 * ```js
 * import { _x } from '@wordpress/i18n';
 * import { registerBlockBindingsSource } from '@wordpress/blocks'
 *
 * registerBlockBindingsSource( {
 *     name: 'plugin/my-custom-source',
 *     label: _x( 'My Custom Source', 'block bindings source' ),
 *     getValues: () => getSourceValues(),
 *     setValues: () => updateMyCustomValuesInBatch(),
 *     getPlaceholder: () => 'Placeholder text when the value is undefined',
 *     canUserEditValue: () => true,
 * } );
 * ```
 */
export const registerBlockBindingsSource = ( source ) => {
	const {
		name,
		label,
		usesContext,
		getValues,
		setValues,
		getPlaceholder,
		canUserEditValue,
		getFieldsList,
	} = source;

	const existingSource = unlock(
		select( blocksStore )
	).getBlockBindingsSource( name );

	/*
	 * Check if the source has been already registered on the client.
	 * If the `getValues` property is defined, it could be assumed the source is already registered.
	 */
	if ( existingSource?.getValues ) {
		warning(
			'Block bindings source "' + name + '" is already registered.'
		);
		return;
	}

	// Check the `name` property is correct.
	if ( ! name ) {
		warning( 'Block bindings source must contain a name.' );
		return;
	}

	if ( typeof name !== 'string' ) {
		warning( 'Block bindings source name must be a string.' );
		return;
	}

	if ( /[A-Z]+/.test( name ) ) {
		warning(
			'Block bindings source name must not contain uppercase characters.'
		);
		return;
	}

	if ( ! /^[a-z0-9/-]+$/.test( name ) ) {
		warning(
			'Block bindings source name must contain only valid characters: lowercase characters, hyphens, or digits. Example: my-plugin/my-custom-source.'
		);
		return;
	}

	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( name ) ) {
		warning(
			'Block bindings source name must contain a namespace and valid characters. Example: my-plugin/my-custom-source.'
		);
		return;
	}

	// Check the `label` property is correct.
	if ( label && existingSource?.label ) {
		warning(
			'Block bindings "' +
				name +
				'" source label is already defined in the server.'
		);
		return;
	}

	if ( ! label && ! existingSource?.label ) {
		warning( 'Block bindings source must contain a label.' );
		return;
	}

	if ( label && typeof label !== 'string' ) {
		warning( 'Block bindings source label must be a string.' );
		return;
	}

	// Check the `usesContext` property is correct.
	if ( usesContext && ! Array.isArray( usesContext ) ) {
		warning( 'Block bindings source usesContext must be an array.' );
		return;
	}

	// Check the `getValues` property is correct.
	if ( getValues && typeof getValues !== 'function' ) {
		warning( 'Block bindings source getValues must be a function.' );
		return;
	}

	// Check the `setValues` property is correct.
	if ( setValues && typeof setValues !== 'function' ) {
		warning( 'Block bindings source setValues must be a function.' );
		return;
	}

	// Check the `getPlaceholder` property is correct.
	if ( getPlaceholder && typeof getPlaceholder !== 'function' ) {
		warning( 'Block bindings source getPlaceholder must be a function.' );
		return;
	}

	// Check the `getPlaceholder` property is correct.
	if ( canUserEditValue && typeof canUserEditValue !== 'function' ) {
		warning( 'Block bindings source canUserEditValue must be a function.' );
		return;
	}

	// Check the `getFieldsList` property is correct.
	if ( getFieldsList && typeof getFieldsList !== 'function' ) {
		// eslint-disable-next-line no-console
		warning( 'Block bindings source getFieldsList must be a function.' );
		return;
	}

	return unlock( dispatch( blocksStore ) ).addBlockBindingsSource( source );
};

/**
 * Unregisters a block bindings source
 *
 * @param {string} name The name of the block bindings source to unregister.
 *
 * @example
 * ```js
 * import { unregisterBlockBindingsSource } from '@wordpress/blocks';
 *
 * unregisterBlockBindingsSource( 'plugin/my-custom-source' );
 * ```
 */
export function unregisterBlockBindingsSource( name ) {
	const oldSource = getBlockBindingsSource( name );
	if ( ! oldSource ) {
		warning( 'Block bindings source "' + name + '" is not registered.' );
		return;
	}
	unlock( dispatch( blocksStore ) ).removeBlockBindingsSource( name );
}

/**
 * Returns a registered block bindings source.
 *
 * @param {string} name Block bindings source name.
 *
 * @return {?Object} Block bindings source.
 */
export function getBlockBindingsSource( name ) {
	return unlock( select( blocksStore ) ).getBlockBindingsSource( name );
}

/**
 * Returns all registered block bindings sources.
 *
 * @return {Array} Block bindings sources.
 */
export function getBlockBindingsSources() {
	return unlock( select( blocksStore ) ).getAllBlockBindingsSources();
}
