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
}

/**
 * Return an SVG icon.
 *
 * @param props The component props.
 *
 * @return Icon component
 */
export default forwardRef< HTMLElement, IconProps >(
	( { icon, size = 24, ...props }: IconProps, ref ) => {
		return cloneElement( icon, {
			width: size,
			height: size,
			...props,
			ref,
		} );
	}
);
