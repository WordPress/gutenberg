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
	 * Autoplays HTML5 video. This only applies to video sources (`url`).
	 *
	 * @default true
	 */
	autoPlay?: boolean;
	/**
	 * Callback which is called when the focal point changes.
	 */
	onChange: ( value: FocalPoint ) => void;
	onDrag?: ( value: FocalPoint, event: MouseEvent ) => void;
	/**
	 * Callback which is called at the end of drag operations.
	 */
	onDragEnd?: ( event: MouseEvent ) => void;
	/**
	 * Callback which is called at the start of drag operations.
	 */
	onDragStart?: (
		value: FocalPoint,
		event: React.MouseEvent< Element, MouseEvent >
	) => void;
	/**
	 * Function which is called before internal updates to the value state.
	 * It receives the upcoming value and may return a modified one.
	 */
	resolvePoint?: ( point: FocalPoint ) => FocalPoint | undefined;
	/**
	 * URL of the image or video to be displayed.
	 */
	url: string;
	/**
	 * The focal point. Should be an object containing `x` and `y` params.
	 */
	value: FocalPoint;
};

export type FocalPointPickerControlsProps = {
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
	mediaRef?: Ref< any >;
	onLoad?: ReactEventHandler< any >;
	src: string;
};

export type FocalPointProps = {
	isDragging: boolean;
	left: CSSProperties[ 'left' ];
	top: CSSProperties[ 'left' ];
};
