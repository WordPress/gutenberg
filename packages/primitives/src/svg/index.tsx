import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react';
import { createElement, forwardRef } from '@wordpress/element';
import type { SVGProps } from './types';

export type { SVGProps } from './types';

/**
 * @param {React.ComponentPropsWithoutRef<'circle'>} props
 *
 * @return {React.JSX.Element} Circle component
 */
export const Circle = ( props: ComponentPropsWithoutRef< 'circle' > ) =>
	createElement( 'circle', props );

/**
 * @param {React.ComponentPropsWithoutRef<'g'>} props
 *
 * @return {React.JSX.Element} G component
 */
export const G = ( props: ComponentPropsWithoutRef< 'g' > ) =>
	createElement( 'g', props );

/**
 * @param {React.ComponentPropsWithoutRef<'line'>} props
 *
 * @return {React.JSX.Element} Path component
 */
export const Line = ( props: ComponentPropsWithoutRef< 'line' > ) =>
	createElement( 'line', props );

/**
 * @param {React.ComponentPropsWithoutRef<'path'>} props
 *
 * @return {React.JSX.Element} Path component
 */
export const Path = ( props: ComponentPropsWithoutRef< 'path' > ) =>
	createElement( 'path', props );

/**
 * @param {React.ComponentPropsWithoutRef<'polygon'>} props
 *
 * @return {React.JSX.Element} Polygon component
 */
export const Polygon = ( props: ComponentPropsWithoutRef< 'polygon' > ) =>
	createElement( 'polygon', props );

/**
 * @param {React.ComponentPropsWithoutRef<'rect'>} props
 *
 * @return {React.JSX.Element} Rect component
 */
export const Rect = ( props: ComponentPropsWithoutRef< 'rect' > ) =>
	createElement( 'rect', props );

/**
 * @param {React.ComponentPropsWithoutRef<'defs'>} props
 *
 * @return {React.JSX.Element} Defs component
 */
export const Defs = ( props: ComponentPropsWithoutRef< 'defs' > ) =>
	createElement( 'defs', props );

/**
 * @param {React.ComponentPropsWithoutRef<'radialGradient'>} props
 *
 * @return {React.JSX.Element} RadialGradient component
 */
export const RadialGradient = (
	props: ComponentPropsWithoutRef< 'radialGradient' >
) => createElement( 'radialGradient', props );

/**
 * @param {React.ComponentPropsWithoutRef<'linearGradient'>} props
 *
 * @return {React.JSX.Element} LinearGradient component
 */
export const LinearGradient = (
	props: ComponentPropsWithoutRef< 'linearGradient' >
) => createElement( 'linearGradient', props );

/**
 * @param {React.ComponentPropsWithoutRef<'stop'>} props
 *
 * @return {React.JSX.Element} Stop component
 */
export const Stop = ( props: ComponentPropsWithoutRef< 'stop' > ) =>
	createElement( 'stop', props );

export const SVG = forwardRef(
	/**
	 * @param {SVGProps}                          props isPressed indicates whether the SVG should appear as pressed.
	 *                                                  Other props will be passed through to svg component.
	 * @param {React.ForwardedRef<SVGSVGElement>} ref   The forwarded ref to the SVG element.
	 *
	 * @return {React.JSX.Element} Stop component
	 */
	(
		{ className, isPressed, ...props }: SVGProps,
		ref: ForwardedRef< SVGSVGElement >
	) => {
		const appliedProps = {
			...props,
			className:
				clsx( className, { 'is-pressed': isPressed } ) || undefined,
			'aria-hidden': true,
			focusable: false,
		};

		return <svg { ...appliedProps } ref={ ref } />;
	}
);
SVG.displayName = 'SVG';
