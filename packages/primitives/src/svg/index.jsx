/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { createElement, forwardRef } from '@wordpress/element';

/** @typedef {{isPressed?: boolean} & React.ComponentPropsWithoutRef<'svg'>} SVGProps */

/**
 * @param {React.ComponentPropsWithoutRef<'circle'>} props
 *
 * @return {React.JSX.Element} Circle component
 */
export const Circle = ( props ) => createElement( 'circle', props );

/**
 * @param {React.ComponentPropsWithoutRef<'g'>} props
 *
 * @return {React.JSX.Element} G component
 */
export const G = ( props ) => createElement( 'g', props );

/**
 * @param {React.ComponentPropsWithoutRef<'line'>} props
 *
 * @return {React.JSX.Element} Path component
 */
export const Line = ( props ) => createElement( 'line', props );

/**
 * @param {React.ComponentPropsWithoutRef<'path'>} props
 *
 * @return {React.JSX.Element} Path component
 */
export const Path = ( props ) => createElement( 'path', props );

/**
 * @param {React.ComponentPropsWithoutRef<'polygon'>} props
 *
 * @return {React.JSX.Element} Polygon component
 */
export const Polygon = ( props ) => createElement( 'polygon', props );

/**
 * @param {React.ComponentPropsWithoutRef<'rect'>} props
 *
 * @return {React.JSX.Element} Rect component
 */
export const Rect = ( props ) => createElement( 'rect', props );

/**
 * @param {React.ComponentPropsWithoutRef<'defs'>} props
 *
 * @return {React.JSX.Element} Defs component
 */
export const Defs = ( props ) => createElement( 'defs', props );

/**
 * @param {React.ComponentPropsWithoutRef<'radialGradient'>} props
 *
 * @return {React.JSX.Element} RadialGradient component
 */
export const RadialGradient = ( props ) =>
	createElement( 'radialGradient', props );

/**
 * @param {React.ComponentPropsWithoutRef<'linearGradient'>} props
 *
 * @return {React.JSX.Element} LinearGradient component
 */
export const LinearGradient = ( props ) =>
	createElement( 'linearGradient', props );

/**
 * @param {React.ComponentPropsWithoutRef<'stop'>} props
 *
 * @return {React.JSX.Element} Stop component
 */
export const Stop = ( props ) => createElement( 'stop', props );

export const SVG = forwardRef(
	/**
	 * @param {SVGProps}                          props isPressed indicates whether the SVG should appear as pressed.
	 *                                                  Other props will be passed through to svg component.
	 * @param {React.ForwardedRef<SVGSVGElement>} ref   The forwarded ref to the SVG element.
	 *
	 * @return {React.JSX.Element} Stop component
	 */
	( { className, isPressed, ...props }, ref ) => {
		const appliedProps = {
			...props,
			className:
				clsx( className, { 'is-pressed': isPressed } ) || undefined,
			'aria-hidden': true,
			focusable: false,
		};

		// Disable reason: We need to have a way to render HTML tag for web.
		// eslint-disable-next-line react/forbid-elements
		return <svg { ...appliedProps } ref={ ref } />;
	}
);
SVG.displayName = 'SVG';
