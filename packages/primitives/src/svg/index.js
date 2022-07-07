/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/** @typedef {{isPressed?: boolean} & import('react').ComponentPropsWithoutRef<'svg'>} SVGProps */

/**
 * @param {import('react').ComponentPropsWithoutRef<'circle'>} props
 *
 * @return {JSX.Element} Circle component
 */
export const Circle = ( props ) => createElement( 'circle', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'g'>} props
 *
 * @return {JSX.Element} G component
 */
export const G = ( props ) => createElement( 'g', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'path'>} props
 *
 * @return {JSX.Element} Path component
 */
export const Path = ( props ) => createElement( 'path', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'polygon'>} props
 *
 * @return {JSX.Element} Polygon component
 */
export const Polygon = ( props ) => createElement( 'polygon', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'rect'>} props
 *
 * @return {JSX.Element} Rect component
 */
export const Rect = ( props ) => createElement( 'rect', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'defs'>} props
 *
 * @return {JSX.Element} Defs component
 */
export const Defs = ( props ) => createElement( 'defs', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'radialGradient'>} props
 *
 * @return {JSX.Element} RadialGradient component
 */
export const RadialGradient = ( props ) =>
	createElement( 'radialGradient', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'linearGradient'>} props
 *
 * @return {JSX.Element} LinearGradient component
 */
export const LinearGradient = ( props ) =>
	createElement( 'linearGradient', props );

/**
 * @param {import('react').ComponentPropsWithoutRef<'stop'>} props
 *
 * @return {JSX.Element} Stop component
 */
export const Stop = ( props ) => createElement( 'stop', props );

/**
 *
 * @param {SVGProps} props isPressed indicates whether the SVG should appear as pressed.
 *                         Other props will be passed through to svg component.
 *
 * @return {JSX.Element} Stop component
 */
export const SVG = ( { className, isPressed, ...props } ) => {
	const appliedProps = {
		...props,
		className:
			classnames( className, { 'is-pressed': isPressed } ) || undefined,
		'aria-hidden': true,
		focusable: false,
	};

	// Disable reason: We need to have a way to render HTML tag for web.
	// eslint-disable-next-line react/forbid-elements
	return <svg { ...appliedProps } />;
};
