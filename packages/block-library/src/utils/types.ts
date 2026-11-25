import type { CSSProperties } from 'react';
import type {
	BlockStyle,
	BlockStyleState,
	MediaUploadOptions,
} from '@wordpress/block-editor';
import type {
	BlockConfiguration,
	BlockEditProps,
	registerBlockType,
} from '@wordpress/blocks';

/**
 * A block as each block directory exports it, ready to register.
 */
export interface BlockModule {
	/**
	 * Block name.
	 */
	name: string;
	/**
	 * Parsed block.json metadata.
	 */
	metadata: Omit< BlockConfiguration, 'name' >;
	/**
	 * Block settings.
	 */
	settings?: Parameters< typeof registerBlockType >[ 1 ];
}

/**
 * The `style.typography` part of a block's attributes.
 */
export interface TypographyStyle {
	fontFamily?: string;
	textAlign?: string;
	[ key: string ]: unknown;
}

/**
 * Block attributes whose `style` the migrations and hooks read.
 */
export interface StyledBlockAttributes {
	textAlign?: string;
	style?: {
		typography?: TypographyStyle;
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

/**
 * Props `useDeprecatedTextAlign` reads from the block edit props.
 */
export interface DeprecatedTextAlignProps extends Pick<
	BlockEditProps< StyledBlockAttributes >,
	'attributes' | 'setAttributes'
> {
	/**
	 * Block name.
	 */
	name: string;
}

/**
 * The `metadata.bindings` of a block.
 */
export type BlockBindings = Record< string, unknown >;

/**
 * Block attributes that survive a block transform.
 */
export interface TransformedAttributes {
	metadata?: Record< string, unknown >;
	[ key: string ]: unknown;
}

/**
 * Arguments of `useUploadMediaFromBlobURL`.
 */
export interface UploadMediaFromBlobURLArgs {
	/**
	 * Blob URL.
	 */
	url?: string;
	/**
	 * Array of allowed media types.
	 */
	allowedTypes?: MediaUploadOptions[ 'allowedTypes' ];
	/**
	 * Function called when the media is uploaded. Receives `undefined` when the
	 * upload returns no media.
	 */
	onChange?: ( media: Record< string, unknown > | undefined ) => void;
	/**
	 * Function called when an error happens.
	 */
	onError?: ( message: string ) => void;
}

/**
 * A map of dimension names to values, such as `width` or `aspectRatio`.
 */
export type Dimensions = Record< string, unknown >;

/**
 * Block attributes holding root dimensions and a `style` attribute.
 */
export interface DimensionAttributes {
	style?: BlockStyle;
	[ key: string ]: unknown;
}

/**
 * Options of `getActiveDimensionValue`.
 */
export interface ActiveDimensionValueOptions {
	attributes?: DimensionAttributes;
	style?: BlockStyle;
	selectedState?: BlockStyleState;
	hasSelectedStyleState?: boolean;
	attributeKey?: string;
	styleKey?: string;
	rootValue?: unknown;
}

/**
 * Options of `getDimensionUpdateAttributes`.
 */
export interface DimensionUpdateOptions {
	style?: BlockStyle;
	selectedState?: BlockStyleState;
	hasSelectedStyleState?: boolean;
	nextDimensions: Dimensions;
	dimensionKeyMap?: Record< string, string >;
	dimensionKeys?: string[];
}

/**
 * Options of `getDimensionResetAttributes`.
 */
export interface DimensionResetOptions {
	attributes?: DimensionAttributes;
	style?: BlockStyle;
	selectedState?: BlockStyleState;
	hasSelectedStyleState?: boolean;
	keys: string[];
	defaultAttributes?: Record< string, unknown >;
}

/**
 * Props for `HtmlRenderer`.
 */
export interface HtmlRendererProps {
	/**
	 * The props to merge with the root element.
	 * `className` and `style` are merged with the parsed HTML attributes.
	 */
	wrapperProps?: {
		className?: string;
		style?: CSSProperties;
		[ key: string ]: unknown;
	};
	/**
	 * The HTML content to render.
	 */
	html?: string;
}
