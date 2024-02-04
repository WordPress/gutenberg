/**
 * External dependencies
 */

import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import type { BlockAttribute, BlockAttributes } from './block-attributes';
import type { BlockCategory } from './block-category';
import type { BlockDeprecation } from './block-depreciation';
import type { BlockIcon, BlockIconNormalized } from './block-icon';
import type { BlockEditProps, BlockSaveProps } from './block-props';
import type { BlockStyle, BlockSupports } from './block-supports';
import type { Transform } from './transform';

/**
 * Core provided {@link BlockType} category type.
 *
 * Plugins and Themes can also register other custom {@link BlockCategory block categories}.
 *
 * @public
 */
export type BlockTypeCategory =
	| 'text'
	| 'media'
	| 'design'
	| 'widgets'
	| 'theme'
	| 'embed';

/**
 * Internal type for the innerBlocks property inside of the example
 *
 * @see BlockType.example
 * @see {@link https://github.com/DefinitelyTyped/DefinitelyTyped/pull/55245#discussion_r692208988}
 * @internal
 */
export type BlockExampleInnerBlock = Partial< BlockType > &
	Pick< BlockType, 'name' | 'attributes' > & {
		innerBlocks?: BlockExampleInnerBlock[];
	};

/**
 * Configuration of a {@link BlockType}.
 *
 * Used by `registerBlockType` in [registration.js](../api/registration.js)
 *
 * @public
 */
export type BlockConfiguration<
	Attributes extends Record< string, any > = {},
> = Partial< Omit< BlockType< Attributes >, 'icon' > > &
	Pick< BlockType< Attributes >, 'attributes' | 'category' | 'title' > & {
		icon?: BlockIcon;
	};

/**
 * Defined behavior of a block type.
 *
 * @memberof module:blocks/BlockType
 * @public
 */
export interface BlockType< Attributes extends Record< string, any > = {} > {
	/**
	 * The version of the Block API used by the block.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#api-version}
	 */
	apiVersion?: number;

	/**
	 * Attributes for the block.
	 */
	attributes: {
		[ k in keyof Attributes ]: BlockAttribute<
			Attributes[ k ] extends Array< infer U > ? U : Attributes[ k ]
		>;
	};

	/**
	 * The block category (determines placement in the inserter).
	 */
	category: BlockTypeCategory;

	/**
	 * Array of deprecation handlers for the block.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/ Deprecation}
	 */
	deprecated?: BlockDeprecation< Attributes >[];

	/**
	 * This is a short description for your block, which can be translated
	 * with our translation functions.
	 */
	description?: string;

	/**
	 * Component to render in the editor.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit Edit and Save} on developer.wordpress.org
	 */
	edit?: ComponentType< BlockEditProps< Attributes > >;

	/**
	 * Block type editor script definition.
	 * It will only be enqueued in the context of the editor.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-script}
	 */
	editorScript?: string;

	/**
	 * Block type editor style definition.
	 * It will only be enqueued in the context of the editor.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#editor-style}
	 */
	editorStyle?: string;

	/**
	 * It provides structured example data for the block.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#example}
	 */

	example?: Partial< BlockType > & {
		innerBlocks?: BlockExampleInnerBlock[];
	};

	/**
	 * Icon for the block.
	 */
	icon: BlockIconNormalized;

	/**
	 * Searchable keywords for discovery.
	 */
	keywords?: string[];

	/**
	 * Setting `parent` lets a block require that it is only available when
	 * nested within the specified blocks.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#parent}
	 */
	parent?: string[];

	/**
	 * Setting `ancestor` lets a block require that it is only available when
	 * nested within the specified blocks.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#ancestor}
	 */
	ancestor?: string[];

	/**
	 * Context provided for available access by descendants of blocks of this
	 * type, in the form of an object which maps a context name to one of the
	 * block’s own attribute.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#provides-context}
	 */
	providesContext?: Record< string, keyof Attributes >;

	/**
	 * This is set internally when registering the type.
	 */
	name: string;

	/**
	 * Component to render on the frontend.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit Edit and Save} on developer.wordpress.org
	 */
	save: ComponentType< BlockSaveProps< Attributes > >;

	/**
	 * Block type frontend script definition.
	 * It will be enqueued both in the editor and when viewing the content on
	 * the front of the site.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#script}
	 */
	script?: string;

	/**
	 * Block type editor style definition.
	 * It will only be enqueued in the context of the editor.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#style}
	 */
	style?: string;

	/**
	 * Block styles.
	 *
	 * @see {@link https://wordpress.org/gutenberg/handbook/extensibility/extending-blocks/#block-style-variations}
	 */
	styles?: BlockStyle[];

	/**
	 * Optional block extended support features.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/ Block Supports} on developer.wordpress.org
	 */
	supports?: BlockSupports;

	/**
	 * The gettext text domain of the plugin/block.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#text-domain}
	 */
	textdomain?: string;

	/**
	 * This is the display title for your block, which can be translated
	 * with our translation functions.
	 */
	title: string;

	/**
	 * Block transformations.
	 */
	transforms?:
		| {
				/**
				 * Transforms from another block type to this block type.
				 */
				from?: Transform< Attributes >[];
				/**
				 * Transforms from this block type to another block type.
				 */
				to?: Transform[];
				/**
				 * The transformations available for mobile devices.
				 *
				 * Used in [factory.js](../api/factory.js)
				 */
				supportedMobileTransforms?: string[];
		  }
		| undefined;

	/**
	 * Array of the names of context values to inherit from an ancestor
	 * provider.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#context}
	 */
	usesContext?: string[];

	/**
	 * The current version number of the block, such as 1.0 or 1.0.3.
	 *
	 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#version}
	 */
	version?: string;

	/**
	 * Sets attributes on the topmost parent element of the current block.
	 */
	getEditWrapperProps?(
		attrs: Attributes
	): Record< string, string | number | boolean >;

	/**
	 * A function that defines how new attributes are merged with existing ones.
	 *
	 * Used in [paragraph](../../../block-library/src/paragraph/index.js)
	 */
	merge?(
		attributes: Attributes,
		attributesToMerge: Attributes
	): Partial< Attributes >;

	/**
	 * Custom block label callback function
	 *
	 * @internal
	 */
	__experimentalLabel(
		attributes: BlockAttributes,
		settings: { context: 'accessibility' | 'visual' } // TODO find all context types
	): string;
}
