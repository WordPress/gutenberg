import type { ReactNode, SyntheticEvent } from 'react';

/**
 * An image size option of `ImageSizeControl`.
 */
export interface ImageSizeOption {
	label: string;
	value: string;
	disabled?: boolean;
}

/**
 * The image dimensions `ImageSizeControl` changes.
 */
export interface ImageDimensions {
	width?: number;
	height?: number;
}

/**
 * Props of `ImageSizeControl`.
 */
export interface ImageSizeControlProps {
	imageSizeHelp?: ReactNode;
	imageWidth?: number | string;
	imageHeight?: number | string;
	imageSizeOptions?: ImageSizeOption[];
	isResizable?: boolean;
	slug?: string;
	width?: number | string | null;
	height?: number | string | null;
	onChange: ( dimensions: ImageDimensions ) => void;
	onChangeImage?: (
		value: string,
		details: { event: Event | SyntheticEvent | undefined }
	) => void;
}
