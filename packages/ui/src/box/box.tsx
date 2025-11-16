/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { type BoxProps } from './types';
import { renderElement } from '../utils/element';

/**
 * Default render function that renders a div element with the given props.
 *
 * @param props The props to apply to the HTML element.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'div' > ) => (
	<div { ...props } />
);

/**
 * Capitalizes the first character of a string.
 *
 * @param str The string to capitalize.
 * @return The capitalized string.
 */
const capitalize = ( str: string ): string =>
	str.charAt( 0 ).toUpperCase() + str.slice( 1 );

/**
 * Converts a size value to a CSS design token property reference (with
 * fallback) or a calculated value based on the base unit.
 *
 * @param property The CSS property name.
 * @param target   The design system token target.
 * @param value    The size value, either a number (multiplier of base unit) or a string (token name).
 * @return A CSS value string with variable references.
 */
const getSpacingValue = (
	property: string,
	target: string,
	value: number | string
): string =>
	typeof value === 'number'
		? `calc(var(--wpds-dimension-base) * ${ value })`
		: `var(--wpds-dimension-${ property }-${ target }-${ value }, var(--wpds-dimension-${ property }-surface-${ value }))`;

/**
 * Generates CSS styles for properties with optionally directional values,
 * normalizing single values and objects with directional keys for logical
 * properties.
 *
 * @param property The CSS property name from BoxProps.
 * @param target   The design system token target.
 * @param value    The property value (single or object with directional keys).
 * @return A CSSProperties object with the computed styles.
 */
const getDimensionVariantStyles = < T extends keyof BoxProps >(
	property: T,
	target: string,
	value: NonNullable< BoxProps[ T ] >
): React.CSSProperties =>
	typeof value !== 'object'
		? { [ property ]: getSpacingValue( property, target, value ) }
		: Object.keys( value ).reduce(
				( result, key ) => ( {
					...result,
					[ property + capitalize( key ) ]: getSpacingValue(
						property,
						target,
						value[ key ]
					),
				} ),
				{} as Record< string, string >
		  );

/**
 * A low-level visual primitive that provides an interface for applying design
 * token-based customization for background, text, padding, and more.
 */
export const Box = forwardRef< HTMLDivElement, BoxProps >( function Box(
	{
		target = 'surface',
		backgroundColor,
		color,
		padding,
		bg = backgroundColor,
		fg = color,
		p = padding,
		render = DEFAULT_RENDER,
		...props
	},
	ref
) {
	const style: React.CSSProperties = {};

	if ( bg ) {
		style.backgroundColor = `var(--wpds-color-bg-${ target }-${ bg }, var(--wpds-color-bg-surface-${ bg }))`;
	}

	if ( fg ) {
		style.color = `var(--wpds-color-fg-${ target }-${ fg }, var(--wpds-color-fg-content-${ fg }))`;
	}

	if ( p ) {
		Object.assign(
			style,
			getDimensionVariantStyles( 'padding', target, p )
		);
	}

	return renderElement< 'div' >( render, { style, ...props }, ref );
} );
