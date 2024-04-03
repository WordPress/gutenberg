/**
 * External dependencies
 */
import type {
	CSSProperties,
	ReactEventHandler,
	Ref,
	VideoHTMLAttributes,
} from 'react';

/**
 * Internal dependencies
 */
import type { BaseControlProps } from '../base-control/types';

export type FocalPoint = Record< FocalPointAxis, number >;
export type FocalPointAxis = 'x' | 'y';

export type FocalPointPickerProps = Pick<
	BaseControlProps,
	'help' | 'hideLabelFromVision' | 'label'
> & {
	/**
	 * Start opting into the new margin-free styles that will become the default in a future version.
	 *
	 * @default false
	 */
	__nextHasNoMarginBottom?: boolean;
	/**
	 * Start opting into the larger default height that will become the default size in a future version.
	 *
	 * @default false
	 */
	__next40pxDefaultSize?: boolean;
	/**
	 * Autoplays HTML5 video. This only applies to video sources (`url`).
	 *
	 * @default true
	 */
	autoPlay?: FocalPointPickerMediaProps[ 'autoPlay' ];
	/**
	 * Callback which is called when the focal point changes.
	 */
	onChange: ( value: FocalPoint ) => void;
	onDrag?: ( value: FocalPoint, event: MouseEvent ) => void;
	/**
	 * Callback which is called at the end of drag operations.
	 */
	onDragEnd?: () => void;
	/**
	 * Callback which is called at the start of drag operations.
	 */
	onDragStart?: ( value: FocalPoint, event: React.MouseEvent ) => void;
	/**
	 * Function which is called before internal updates to the value state.
	 * It receives the upcoming value and may return a modified one.
	 */
	resolvePoint?: ( point: FocalPoint ) => FocalPoint;
	/**
	 * URL of the image or video to be displayed.
	 */
	url: FocalPointPickerMediaProps[ 'src' ];
	/**
	 * The focal point. Should be an object containing `x` and `y` params.
	 */
	value: FocalPoint;
};

export type FocalPointPickerControlsProps = {
	__nextHasNoMarginBottom?: boolean;
	__next40pxDefaultSize?: boolean;
	/**
	 * A bit of extra bottom margin will be added if a `help` text
	 * needs to be rendered under it.
	 */
	hasHelpText: boolean;
	onChange?: ( value: FocalPoint ) => void;
	point?: FocalPoint;
};

export type FocalPointPickerGridProps = {
	bounds: { width: number; height: number };
	showOverlay?: boolean;
};

export type FocalPointPickerMediaProps = Pick<
	VideoHTMLAttributes< HTMLVideoElement >,
	'autoPlay' | 'muted'
> & {
	alt: string;
	mediaRef?: Ref< HTMLDivElement | HTMLVideoElement | HTMLImageElement >;
	onLoad?: ReactEventHandler< HTMLVideoElement | HTMLImageElement >;
	src: string;
};

export type FocalPointProps = {
	isDragging: boolean;
	left: CSSProperties[ 'left' ];
	top: CSSProperties[ 'top' ];
};
