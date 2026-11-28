import type { CSSProperties, ReactNode } from 'react';

/**
 * A crop area in pixels. It matches the cropper's `Area`, declared here so
 * the public declarations do not load the cropper's types.
 */
export interface CropArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Border classes and styles of the edited image.
 */
export interface ImageBorderProps {
	className?: string;
	style?: CSSProperties;
}

/**
 * The image the editor saves.
 */
export interface SavedImage {
	id: number;
	url: string;
}

/**
 * Props of `ImageEditor`.
 */
export interface ImageEditorProps {
	/**
	 * Media attachment ID.
	 */
	id: number;
	/**
	 * Media URL.
	 */
	url: string;
	/**
	 * Rendered image width.
	 */
	width?: number;
	/**
	 * Rendered image height.
	 */
	height?: number;
	/**
	 * Natural image height.
	 */
	naturalHeight: number;
	/**
	 * Natural image width.
	 */
	naturalWidth: number;
	/**
	 * Callback to save image attributes.
	 */
	onSaveImage: ( image: SavedImage ) => void;
	/**
	 * Callback when editing finishes.
	 */
	onFinishEditing: () => void;
	/**
	 * Border classes and styles.
	 */
	borderProps?: ImageBorderProps;
}

/**
 * Props of the image editing context provider.
 */
export type ImageEditingProviderProps = Pick<
	ImageEditorProps,
	| 'id'
	| 'url'
	| 'naturalWidth'
	| 'naturalHeight'
	| 'onSaveImage'
	| 'onFinishEditing'
> & {
	children?: ReactNode;
};

/**
 * Props of the image cropper.
 */
export type ImageEditorCropperProps = Pick<
	ImageEditorProps,
	| 'url'
	| 'width'
	| 'height'
	| 'naturalHeight'
	| 'naturalWidth'
	| 'borderProps'
>;

/**
 * The image transform state and its setters.
 */
export interface TransformImage {
	editedUrl: string | undefined;
	setEditedUrl: ( url: string | undefined ) => void;
	crop: CropArea | undefined;
	zoom: number;
	setZoom: ( zoom: number ) => void;
	rotation: number;
	rotateClockwise: () => void;
	aspect: number;
	setAspect: ( aspect: number ) => void;
	defaultAspect: number;
}

/**
 * Options of the hook that saves the edited image.
 */
export type SaveImageOptions = Pick<
	ImageEditorProps,
	'id' | 'url' | 'onSaveImage' | 'onFinishEditing'
> &
	Pick< TransformImage, 'crop' | 'rotation' >;

/**
 * The saving state and actions of the image editor.
 */
export interface SaveImage {
	isInProgress: boolean;
	apply: () => Promise< void >;
	cancel: () => void;
}

/**
 * The value of the image editing context.
 */
export type ImageEditingContextValue = TransformImage & SaveImage;

/**
 * Saves edits to a media item, set in the settings under `mediaEditKey`.
 */
export type EditMediaEntity = (
	id: number,
	edits: {
		src: string;
		modifiers: { type: string; args: Record< string, number > }[];
	},
	options: { throwOnError: boolean }
) => Promise< { id: number; source_url: string } | undefined >;

/**
 * An aspect ratio option. Theme ratios keep the string from the settings.
 */
export interface AspectRatioOption {
	name: string;
	slug: string;
	ratio: number | string;
}

/**
 * Props of a group of aspect ratio options.
 */
export interface AspectRatioGroupProps {
	aspectRatios: AspectRatioOption[];
	isDisabled: boolean;
	label?: string;
	onClick: ( ratio: number | string ) => void;
	value: number;
}
