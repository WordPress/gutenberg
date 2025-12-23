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
 * Converts a size token name to a CSS design token property reference (with
 * fallback).
 *
 * @param property The CSS property name.
 * @param target   The design system token target.
 * @param value    The size token name.
 * @return A CSS value string with variable references.
 */
const getSpacingValue = (
	property: string,
	target: string,
	value: string
): string =>
	`var(--wpds-dimension-${ property }-${ target }-${ value }, var(--wpds-dimension-${ property }-surface-${ value }))`;

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
		borderRadius,
		borderWidth,
		borderColor,
		render = DEFAULT_RENDER,
		...props
	},
	ref
) {
	const style: React.CSSProperties = { ...props.style };

	if ( backgroundColor ) {
		style.backgroundColor = `var(--wpds-color-bg-${ target }-${ backgroundColor }, var(--wpds-color-bg-surface-${ backgroundColor }))`;
	}

	if ( color ) {
		style.color = `var(--wpds-color-fg-${ target }-${ color }, var(--wpds-color-fg-content-${ color }))`;
	}

	if ( padding ) {
		Object.assign(
			style,
			getDimensionVariantStyles( 'padding', target, padding )
		);
	}

	if ( borderRadius ) {
		style.borderRadius = `var(--wpds-border-radius-${ target }-${ borderRadius }, var(--wpds-border-radius-surface-${ borderRadius }))`;
	}

	if ( borderWidth ) {
		style.borderWidth = `var(--wpds-border-width-${ target }-${ borderWidth }, var(--wpds-border-width-surface-${ borderWidth }))`;
		style.borderStyle = 'solid';
	}

	if ( borderColor ) {
		style.borderColor = `var(--wpds-color-stroke-${ target }-${ borderColor }, var(--wpds-color-stroke-surface-${ borderColor }))`;
	}

	return renderElement< 'div' >( {
		render,
		ref,
		props: { ...props, style },
	} );
} );
