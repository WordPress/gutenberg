/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

// Disable reason: JSDoc linter doesn't seem to parse the union (`&`) correctly.
/* eslint-disable jsdoc/valid-types */
/** @typedef {import('@wordpress/primitives').ComponentPropsWithoutRef<'SVG'>} SVGProps */
/** @typedef {{icon: string} & {size?: number} & import('@wordpress/primitives').ComponentPropsWithoutRef<'SVG'>} IconProps */
/* eslint-enable jsdoc/valid-types */

/**
 * Return an SVG icon.
 *
 * @param {IconProps} props        Icon component props
 * @param {string}    props.icon   Icon name
 * @param {number}    [props.size] Icon size in pixels
 * @param {SVGProps}  props.props  Other props will be passed to wrapped SVG component
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
