/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

// Disable reason: JSDoc linter doesn't seem to parse the union (`&`) correctly.
/** @typedef {{icon: JSX.Element, size?: number} & import('react').ComponentPropsWithoutRef<'SVG'>} IconProps */

/**
 * Return an SVG icon.
 *
 * @param {IconProps} props icon is the SVG component to render
 *                          size is a number specifiying the icon size in pixels
 *                          Other props will be passed to wrapped SVG component
 *
 * @return {JSX.Element}  Icon component
 */
function Icon( { icon, size = 24, ...props } ) {
	return cloneElement( icon, {
		width: size,
		height: size,
		...props,
	} );
}

export default Icon;
