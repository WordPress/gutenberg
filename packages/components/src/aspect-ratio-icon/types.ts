import type { SVGProps } from 'react';

export type AspectRatioIconProps = Omit<
	SVGProps< SVGSVGElement >,
	'ref' | 'viewBox' | 'width' | 'height'
> & {
	/**
	 * The aspect ratio to draw, as width divided by height, e.g. `16 / 9`.
	 * Values that are not a positive number, like `0` for a free ratio, get
	 * the generic aspect ratio icon.
	 */
	ratio?: number | null;
};

/**
 * Position and size of the rounded rectangle that represents a ratio, in the
 * coordinates of the icon's 24px box.
 */
export type AspectRatioShape = {
	x: number;
	y: number;
	width: number;
	height: number;
};
