/**
 * WordPress dependencies
 */
import { cloneElement, forwardRef } from '@wordpress/element';

/**
 * External dependencies
 */
import type { ReactElement } from 'react';
import type { SVGProps } from '@wordpress/primitives';

export interface IconProps extends SVGProps {
	/**
	 * The SVG component to render
	 */
	icon: ReactElement;
	/**
	 * The size of the icon in pixels
	 *
	 * @default 24
	 */
	size?: number;
	/**
	 * Width of strokes in pixels. Applied to the outer `<svg>` as
	 * `stroke-width`, inherited by stroked paths. Has no visible effect on
	 * fill-based icons. Source SVGs of stroke-based icons carry their own
	 * default; this prop overrides it per call.
	 */
	strokeWidth?: number;
}

/**
 * Return an SVG icon.
 *
 * @param props The component props.
 *
 * @return Icon component
 */
export default forwardRef< HTMLElement, IconProps >(
	( { icon, size = 24, strokeWidth, ...props }, ref ) => {
		return cloneElement(
			icon as ReactElement< React.RefAttributes< Element > >,
			{
				width: size,
				height: size,
				...( strokeWidth !== undefined && { strokeWidth } ),
				...props,
				ref,
			}
		);
	}
);
