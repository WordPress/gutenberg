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
import type {
	BlockType,
	Block,
	BlockVariation,
	BlockVariationScope,
	BlockStyle,
	BlockBindingsSource,
	Icon,
	BlockConfiguration,
} from '../types';

function isObject( object: unknown ): object is Record< string, unknown > {
	return object !== null && typeof object === 'object';
}

/**
 * Sets the server side block definition of blocks.
 *
 * Ignored from documentation due to being marked as unstable.
 *
 * @ignore
 *
 * @param definitions Server-side block definitions
 */
// eslint-disable-next-line camelcase
export function unstable__bootstrapServerSideBlockDefinitions(
	definitions: Record< string, Record< string, unknown > >
): void {
	const { addBootstrappedBlockType } = unlock( dispatch( blocksStore ) );
	for ( const [ name, blockType ] of Object.entries( definitions ) ) {
		addBootstrappedBlockType( name, blockType );
	}
}

/**
 * Gets block settings from metadata loaded from `block.json` file
 *
 * @param metadata            Block metadata loaded from `block.json`.
 * @param metadata.textdomain Textdomain to use with translations.
 *
 * @return Block settings.
 */
function getBlockSettingsFromMetadata( {
	textdomain,
	...metadata
}: Record< string, unknown > & { textdomain?: string } ) {
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
				( i18nBlockSchema as Record< string, unknown > )[ key ],
				settings[ key ],
				textdomain
			);
		} );
	}

	return settings;
}

/**
 * This acts as an intermediate type to explicitly note that the "name" property
 * will be ignored if passed into the settings argument
 */
type SettingsBlockConfiguration<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> = Omit< BlockConfiguration< Attributes >, 'name' > & { name?: unknown };

/**
 * Registers a new block provided a unique name and an object defining its
 * behavior. Once registered, the block is made available as an option to any
 * editor interface where blocks are implemented.
 *
 * For more in-depth information on registering a custom block see the
 * [Create a block tutorial](https://developer.wordpress.org/block-editor/getting-started/create-block/).
 *
 * @param blockNameOrMetadata Block type name or its metadata.
 * @param settings            Block settings.
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
 * @return The block, if it has been successfully registered;
 *         otherwise `undefined`.
 */
export function registerBlockType<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
>(
	blockNameOrMetadata: BlockConfiguration< Attributes >,
	settings?: Partial< SettingsBlockConfiguration< Attributes > >
): BlockType | undefined;
export function registerBlockType<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
>(
	blockNameOrMetadata: string,
	settings: SettingsBlockConfiguration< Attributes >
): BlockType | undefined;
export function registerBlockType<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
>(
	blockNameOrMetadata: string | BlockConfiguration< Attributes >,
	settings?: Partial< SettingsBlockConfiguration< Attributes > >
): BlockType | undefined {
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
 * @param i18nSchema   I18n schema for the block setting.
 * @param settingValue Value for the block setting.
 * @param textdomain   Textdomain to use with translations.
 *
 * @return Translated setting.
 */
function translateBlockSettingUsingI18nSchema(
	i18nSchema: unknown,
	settingValue: unknown,
	textdomain: string
): unknown {
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
		return Object.keys( settingValue ).reduce(
			( accumulator: Record< string, unknown >, key ) => {
				if ( ! ( i18nSchema as Record< string, unknown > )[ key ] ) {
					accumulator[ key ] = settingValue[ key ];
					return accumulator;
				}
				accumulator[ key ] = translateBlockSettingUsingI18nSchema(
					( i18nSchema as Record< string, unknown > )[ key ],
					settingValue[ key ],
					textdomain
				);
				return accumulator;
			},
			{}
		);
	}
	return settingValue;
}

/**
 * Registers a new block collection to group blocks in the same namespace in the inserter.
 *
 * @param namespace      The namespace to group blocks by in the inserter; corresponds to the block namespace.
 * @param settings       The block collection settings.
 * @param settings.title The title to display in the block inserter.
 * @param settings.icon  The icon to display in the block inserter.
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
export function registerBlockCollection(
	namespace: string,
	{ title, icon }: { title: string; icon?: Icon }
): void {
	dispatch( blocksStore ).addBlockCollection( namespace, title, icon );
}

/**
 * Unregisters a block collection
 *
 * @param namespace The namespace to group blocks by in the inserter; corresponds to the block namespace
 *
 * @example
 * ```js
 * import { unregisterBlockCollection } from '@wordpress/blocks';
 *
 * unregisterBlockCollection( 'my-collection' );
 * ```
 */
export function unregisterBlockCollection( namespace: string ): void {
	dispatch( blocksStore ).removeBlockCollection( namespace );
}

/**
 * Unregisters a block.
 *
 * @param name Block name.
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
 * @return The previous block value, if it has been successfully
 *         unregistered; otherwise `undefined`.
 */
export function unregisterBlockType( name: string ): BlockType | undefined {
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
 * @param blockName Block name.
 */
export function setFreeformContentHandlerName( blockName: string ): void {
	dispatch( blocksStore ).setFreeformFallbackBlockName( blockName );
}

/**
 * Retrieves name of block handling non-block content, or undefined if no
 * handler has been defined.
 *
 * @return Block name.
 */
export function getFreeformContentHandlerName(): string | null {
	return select( blocksStore ).getFreeformFallbackBlockName();
}

/**
 * Retrieves name of block used for handling grouping interactions.
 *
 * @return Block name.
 */
export function getGroupingBlockName(): string | null {
	return select( blocksStore ).getGroupingBlockName();
}

/**
 * Assigns name of block handling unregistered block types.
 *
 * @param blockName Block name.
 */
export function setUnregisteredTypeHandlerName( blockName: string ): void {
	dispatch( blocksStore ).setUnregisteredFallbackBlockName( blockName );
}

/**
 * Retrieves name of block handling unregistered block types, or undefined if no
 * handler has been defined.
 *
 * @return Block name.
 */
export function getUnregisteredTypeHandlerName(): string | null {
	return select( blocksStore ).getUnregisteredFallbackBlockName();
}

/**
 * Assigns the default block name.
 *
 * @param name Block name.
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
export function setDefaultBlockName( name: string ): void {
	dispatch( blocksStore ).setDefaultBlockName( name );
}

/**
 * Assigns name of block for handling block grouping interactions.
 *
 * This function lets you select a different block to group other blocks in instead of the
 * default `core/group` block. This function must be used in a component or when the DOM is fully
 * loaded. See https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dom-ready/
 *
 * @param name Block name.
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
export function setGroupingBlockName( name: string ): void {
	dispatch( blocksStore ).setGroupingBlockName( name );
}

/**
 * Retrieves the default block name.
 *
 * @return Block name.
 */
export function getDefaultBlockName(): string | null {
	return select( blocksStore ).getDefaultBlockName();
}

/**
 * Returns a registered block type.
 *
 * @param name Block name.
 *
 * @return Block type.
 */
export function getBlockType( name: string ): BlockType | undefined {
	return select( blocksStore )?.getBlockType( name );
}

/**
 * Returns all registered blocks.
 *
 * @return Block settings.
 */
export function getBlockTypes(): BlockType[] {
	return select( blocksStore ).getBlockTypes();
}

/**
 * Returns the block support value for a feature, if defined.
 *
 * @param nameOrType      Block name or type object
 * @param feature         Feature to retrieve
 * @param defaultSupports Default value to return if not
 *                        explicitly defined
 *
 * @return Block support value
 */
export function getBlockSupport(
	nameOrType: string | BlockType,
	feature: string,
	defaultSupports?: unknown
): unknown {
	return select( blocksStore ).getBlockSupport(
		nameOrType,
		feature,
		defaultSupports
	);
}

/**
 * Returns true if the block defines support for a feature, or false otherwise.
 *
 * @param nameOrType      Block name or type object.
 * @param feature         Feature to test.
 * @param defaultSupports Whether feature is supported by
 *                        default if not explicitly defined.
 *
 * @return Whether block supports feature.
 */
export function hasBlockSupport(
	nameOrType: string | BlockType,
	feature: string,
	defaultSupports?: boolean
): boolean {
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
 * @param blockOrType Block or Block Type to test.
 *
 * @return Whether the given block is a reusable block.
 */
export function isReusableBlock(
	blockOrType: Block | BlockType | null | undefined
): boolean {
	return blockOrType?.name === 'core/block';
}

/**
 * Determines whether or not the given block is a template part. This is a
 * special block type that allows composing a page template out of reusable
 * design elements.
 *
 * @param blockOrType Block or Block Type to test.
 *
 * @return Whether the given block is a template part.
 */
export function isTemplatePart(
	blockOrType: Block | BlockType | null | undefined
): boolean {
	return blockOrType?.name === 'core/template-part';
}

/**
 * Returns an array with the child blocks of a given block.
 *
 * @param blockName Name of block (example: “latest-posts”).
 *
 * @return Array of child block names.
 */
export const getChildBlockNames = ( blockName: string ): string[] => {
	return select( blocksStore ).getChildBlockNames( blockName );
};

/**
 * Returns a boolean indicating if a block has child blocks or not.
 *
 * @param blockName Name of block (example: “latest-posts”).
 *
 * @return True if a block contains child blocks and false otherwise.
 */
export const hasChildBlocks = ( blockName: string ): boolean => {
	return select( blocksStore ).hasChildBlocks( blockName );
};

/**
 * Returns a boolean indicating if a block has at least one child block with inserter support.
 *
 * @param blockName Block type name.
 *
 * @return True if a block contains at least one child blocks with inserter support
 *         and false otherwise.
 */
export const hasChildBlocksWithInserterSupport = (
	blockName: string
): boolean => {
	return select( blocksStore ).hasChildBlocksWithInserterSupport( blockName );
};

/**
 * Registers a new block style for the given block types.
 *
 * For more information on connecting the styles with CSS
 * [the official documentation](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/#styles).
 *
 * @param blockNames     Name of blocks e.g. “core/latest-posts” or `[“core/group”, “core/columns”]`.
 * @param styleVariation Object containing `name` which is the class name applied to the block and `label` which identifies the variation to the user.
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
export const registerBlockStyle = (
	blockNames: string | string[],
	styleVariation: BlockStyle | BlockStyle[]
): void => {
	dispatch( blocksStore ).addBlockStyles( blockNames, styleVariation );
};

/**
 * Unregisters a block style for the given block.
 *
 * @param blockName          Name of block (example: “core/latest-posts”).
 * @param styleVariationName Name of class applied to the block.
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
export const unregisterBlockStyle = (
	blockName: string,
	styleVariationName: string
): void => {
	dispatch( blocksStore ).removeBlockStyles( blockName, styleVariationName );
};

/**
 * Returns an array with the variations of a given block type.
 * Ignored from documentation as the recommended usage is via useSelect from @wordpress/data.
 *
 * @ignore
 *
 * @param blockName Name of block (example: “core/columns”).
 * @param scope     Block variation scope name.
 *
 * @return Block variations.
 */
export const getBlockVariations = (
	blockName: string,
	scope?: BlockVariationScope
): BlockVariation[] | void => {
	return select( blocksStore ).getBlockVariations( blockName, scope );
};

/**
 * Registers a new block variation for the given block type.
 *
 * For more information on block variations see
 * [the official documentation ](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/).
 *
 * @param blockName Name of the block (example: “core/columns”).
 * @param variation Object describing a block variation.
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
export const registerBlockVariation = (
	blockName: string,
	variation: BlockVariation | BlockVariation[]
): void => {
	if ( Array.isArray( variation ) ) {
		for ( const v of variation ) {
			if ( typeof v.name !== 'string' ) {
				warning( 'Variation names must be unique strings.' );
			}
		}
	} else if ( typeof variation.name !== 'string' ) {
		warning( 'Variation names must be unique strings.' );
	}

	dispatch( blocksStore ).addBlockVariations( blockName, variation );
};

/**
 * Unregisters a block variation defined for the given block type.
 *
 * @param blockName     Name of the block (example: “core/columns”).
 * @param variationName Name of the variation defined for the block.
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
export const unregisterBlockVariation = (
	blockName: string,
	variationName: string | string[]
): void => {
	dispatch( blocksStore ).removeBlockVariations( blockName, variationName );
};

/**
 * Registers a new block bindings source with an object defining its
 * behavior. Once registered, the source is available to be connected
 * to the supported block attributes.
 *
 * @since 6.7.0 Introduced in WordPress core.
 *
 * @param source Object describing a block bindings source.
 *
 * @example
 * ```js
 * import { _x } from '@wordpress/i18n';
 * import { registerBlockBindingsSource } from '@wordpress/blocks'
 *
 * registerBlockBindingsSource( {
 *     name: 'plugin/my-custom-source',
 *     label: _x( 'My Custom Source', 'block bindings source' ),
 *     usesContext: [ 'postType' ],
 *     getValues: getSourceValues,
 *     setValues: updateMyCustomValuesInBatch,
 *     canUserEditValue: () => true,
 * } );
 * ```
 */
export const registerBlockBindingsSource = (
	source: BlockBindingsSource
): void => {
	const {
		name,
		label,
		usesContext,
		getValues,
		setValues,
		canUserEditValue,
		getFieldsList,
	} = source;

	const existingSource = unlock(
		select( blocksStore )
	).getBlockBindingsSource( name );

	/*
	 * Check if the source has been already registered on the client.
	 * If any property expected to be "client-only" is defined, return a warning.
	 */
	const serverProps = [ 'label', 'usesContext' ];
	for ( const prop in existingSource ) {
		if ( ! serverProps.includes( prop ) && existingSource[ prop ] ) {
			warning(
				'Block bindings source "' + name + '" is already registered.'
			);
			return;
		}
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

	if ( ! label && ! existingSource?.label ) {
		warning( 'Block bindings source must contain a label.' );
		return;
	}

	if ( label && typeof label !== 'string' ) {
		warning( 'Block bindings source label must be a string.' );
		return;
	}

	if ( label && existingSource?.label && label !== existingSource?.label ) {
		warning( 'Block bindings "' + name + '" source label was overridden.' );
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

	// Check the `canUserEditValue` property is correct.
	if ( canUserEditValue && typeof canUserEditValue !== 'function' ) {
		warning( 'Block bindings source canUserEditValue must be a function.' );
		return;
	}

	// Check the `getFieldsList` property is correct.
	if ( getFieldsList && typeof getFieldsList !== 'function' ) {
		warning( 'Block bindings source getFieldsList must be a function.' );
		return;
	}

	return unlock( dispatch( blocksStore ) ).addBlockBindingsSource( source );
};

/**
 * Unregisters a block bindings source by providing its name.
 *
 * @since 6.7.0 Introduced in WordPress core.
 *
 * @param name The name of the block bindings source to unregister.
 *
 * @example
 * ```js
 * import { unregisterBlockBindingsSource } from '@wordpress/blocks';
 *
 * unregisterBlockBindingsSource( 'plugin/my-custom-source' );
 * ```
 */
export function unregisterBlockBindingsSource( name: string ): void {
	const oldSource = getBlockBindingsSource( name );
	if ( ! oldSource ) {
		warning( 'Block bindings source "' + name + '" is not registered.' );
		return;
	}
	unlock( dispatch( blocksStore ) ).removeBlockBindingsSource( name );
}

/**
 * Returns a registered block bindings source by its name.
 *
 * @since 6.7.0 Introduced in WordPress core.
 *
 * @param name Block bindings source name.
 *
 * @return Block bindings source.
 */
export function getBlockBindingsSource(
	name: string
): BlockBindingsSource | undefined {
	return unlock( select( blocksStore ) ).getBlockBindingsSource( name );
}

/**
 * Returns all registered block bindings sources.
 *
 * @since 6.7.0 Introduced in WordPress core.
 *
 * @return Block bindings sources.
 */
export function getBlockBindingsSources(): Record<
	string,
	BlockBindingsSource
> {
	return unlock( select( blocksStore ) ).getAllBlockBindingsSources();
}
