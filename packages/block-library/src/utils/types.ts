import type { CSSProperties, ElementType, JSX } from 'react';
import type WaveformPlayerLib from '@arraypress/waveform-player/no-autoinit';
import type {
	BlockStyle,
	BlockStyleState,
	MediaUploadOptions,
} from '@wordpress/block-editor';
import type {
	Block,
	BlockConfiguration,
	BlockEditProps,
} from '@wordpress/blocks';

/**
 * A block as each block directory exports it, ready to register.
 */
export interface BlockModule<
	Attributes extends Record< string, unknown > = Record< string, unknown >,
> {
	/**
	 * Block name.
	 */
	name: string;
	/**
	 * Parsed block.json metadata.
	 */
	metadata: Omit< BlockConfiguration< Attributes >, 'name' >;
	/**
	 * Block settings.
	 */
	settings?: Partial< Omit< BlockConfiguration< Attributes >, 'name' > >;
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
	/**
	 * Durable upload identifier. When omitted a new one is generated.
	 */
	uploadId?: string;
	/**
	 * Function called with the resolved upload id when the upload starts.
	 */
	onUploadStart?: ( uploadId: string ) => void;
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

/**
 * Props for `Caption`.
 */
export interface CaptionProps {
	attributeKey?: string;
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	isSelected?: boolean;
	insertBlocksAfter?: ( blocks: Block | Block[] ) => void;
	placeholder?: string;
	label?: string;
	showToolbarButton?: boolean;
	excludeElementClassName?: boolean;
	className?: string;
	readOnly?: boolean;
	tagName?: ElementType;
	addLabel?: string;
	removeLabel?: string;
	icon?: JSX.Element;
	[ key: string ]: unknown;
}

/**
 * Props for `PosterImage`.
 */
export interface PosterImageProps {
	poster?: string;
	onChange: ( image?: Record< string, unknown > ) => void;
}

/**
 * Props for `MediaControlIndicator`.
 */
export interface MediaControlIndicatorProps {
	url?: string;
	mediaType?: string;
}

/**
 * Props for `MediaControlPreview`.
 */
export interface MediaControlPreviewProps {
	url?: string;
	mediaType?: string;
	filename?: string;
	itemGroupProps?: Record< string, unknown >;
	className?: string;
	label?: string;
}

/**
 * Props for `MediaControl`.
 */
export interface MediaControlProps {
	mediaId?: number;
	mediaUrl?: string;
	mediaType?: string;
	filename?: string;
	allowedTypes?: string[];
	onSelect: ( media: Record< string, unknown > ) => void;
	onSelectURL?: ( url: string ) => void;
	onError?: ( message: string ) => void;
	onReset?: () => void;
	isUploading?: boolean;
	emptyLabel?: string;
	useFeaturedImage?: boolean;
	onToggleFeaturedImage?: () => void;
}

/**
 * Extended WaveformPlayer library instance with optional dynamic properties.
 */
export interface WaveformPlayerInstance extends WaveformPlayerLib {
	audio?: HTMLAudioElement | null;
	titleEl?: HTMLElement | null;
	artistEl?: HTMLElement | null;
	artworkEl?: HTMLImageElement | null;
	syncArtist?: ( artist: string ) => void;
	syncArtwork?: ( artwork: string | null, alt: string ) => void;
	applySeekLabel?: ( label: string ) => void;
}

/**
 * Options for `createWaveformContainer`.
 */
export interface WaveformContainerOptions {
	url: string;
	title?: string;
	artist?: string;
	artwork?: string;
	waveformColor: string | string[];
	progressColor: string | string[];
	waveformGradient?: string;
	buttonColor: string;
	seekLabel?: string;
	seekValueText?: string;
	height?: number;
	waveformStyle?: string;
}

/**
 * Styles for `applyWaveformPlayerStyles`.
 */
export interface WaveformPlayerStyles {
	backgroundColor?: string;
	backgroundGradient?: string;
	textColor?: string;
	playButtonColor?: string;
	playButtonGradient?: string;
}

/**
 * Labels for waveform player controls.
 */
export interface WaveformPlayerLabels {
	play?: string;
	pause?: string;
	seek?: string;
	seekValueText?: string;
}

/**
 * Options for `initWaveformPlayer`.
 */
export interface InitWaveformPlayerOptions {
	src: string;
	title?: string;
	artist?: string;
	image?: string;
	imageAlt?: string;
	waveformColor?: string;
	waveformGradient?: string;
	textColor?: string;
	backgroundColor?: string;
	backgroundGradient?: string;
	autoPlay?: boolean;
	onEnded?: () => void;
	labels?: WaveformPlayerLabels;
	waveformStyle?: string;
	showPlayButtonArtwork?: boolean;
}

/**
 * Return value of `initWaveformPlayer`.
 */
export interface InitializedWaveformPlayer {
	instance: WaveformPlayerInstance;
	container: HTMLElement;
	destroy: () => void;
}

/**
 * Metadata for `updatePlayerMetadata`.
 */
export interface WaveformTrackMetadata {
	title?: string;
	artist?: string;
	image?: string;
	imageAlt?: string;
}

/**
 * Props for `WaveformPlayer`.
 */
export interface WaveformPlayerProps {
	src?: string;
	title?: string;
	artist?: string;
	image?: string;
	imageAlt?: string;
	color?: string;
	gradient?: string;
	backgroundColor?: string;
	backgroundGradient?: string;
	textColor?: string;
	waveformStyle?: string;
	onEnded?: () => void;
	showPlayButtonArtwork?: boolean;
}
