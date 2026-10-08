import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react';
import { createElement, forwardRef } from '@wordpress/element';
import type { SVGProps } from './types';

export type { SVGProps } from './types';

/**
 * @param props
 *
 * @return Circle component
 */
export const Circle = ( props: ComponentPropsWithoutRef< 'circle' > ) =>
	createElement( 'circle', props );

/**
 * @param props
 *
 * @return G component
 */
export const G = ( props: ComponentPropsWithoutRef< 'g' > ) =>
	createElement( 'g', props );

/**
 * @param props
 *
 * @return Path component
 */
export const Line = ( props: ComponentPropsWithoutRef< 'line' > ) =>
	createElement( 'line', props );

/**
 * @param props
 *
 * @return Path component
 */
export const Path = ( props: ComponentPropsWithoutRef< 'path' > ) =>
	createElement( 'path', props );

/**
 * @param props
 *
 * @return Polygon component
 */
export const Polygon = ( props: ComponentPropsWithoutRef< 'polygon' > ) =>
	createElement( 'polygon', props );

/**
 * @param props
 *
 * @return Rect component
 */
export const Rect = ( props: ComponentPropsWithoutRef< 'rect' > ) =>
	createElement( 'rect', props );

/**
 * @param props
 *
 * @return Defs component
 */
export const Defs = ( props: ComponentPropsWithoutRef< 'defs' > ) =>
	createElement( 'defs', props );

/**
 * @param props
 *
 * @return RadialGradient component
 */
export const RadialGradient = (
	props: ComponentPropsWithoutRef< 'radialGradient' >
) => createElement( 'radialGradient', props );

/**
 * @param props
 *
 * @return LinearGradient component
 */
export const LinearGradient = (
	props: ComponentPropsWithoutRef< 'linearGradient' >
) => createElement( 'linearGradient', props );

/**
 * @param props
 *
 * @return Stop component
 */
export const Stop = ( props: ComponentPropsWithoutRef< 'stop' > ) =>
	createElement( 'stop', props );

export const SVG = forwardRef(
	/**
	 * @param props           Other props will be passed through to svg component.
	 * @param props.className Class name of the svg component.
	 * @param props.isPressed Indicates whether the SVG should appear as pressed.
	 * @param ref             The forwarded ref to the SVG element.
	 *
	 * @return Stop component
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
