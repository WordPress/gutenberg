/**
 * WordPress dependencies
 */
import { cloneElement, forwardRef } from '@wordpress/element';

/** @typedef {{icon: JSX.Element, size?: number} & import('@wordpress/primitives').SVGProps} IconProps */

/**
 * Return an SVG icon.
 *
 * @param {IconProps}                                 props icon is the SVG component to render
 *                                                          size is a number specifiying the icon size in pixels
 *                                                          Other props will be passed to wrapped SVG component
 * @param {import('react').ForwardedRef<HTMLElement>} ref   The forwarded ref to the SVG element.
 *
 * @return {JSX.Element}  Icon component
 */
function Icon( { icon, size = 24, ...props }, ref ) {
	return cloneElement( icon, {
		width: size,
		height: size,
		...props,
		ref,
	} );
}

export default forwardRef( Icon );
