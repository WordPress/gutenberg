import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import { type BoxProps } from './types';

/**
 * Default render function that renders a div element with the given props.
 */
const DEFAULT_RENDER = ( props: React.ComponentPropsWithoutRef< 'div' > ) => (
	<div { ...props } />
);

/**
 * Capitalizes the first character of a string.
 */
const capitalize = ( str: string ): string =>
	str.charAt( 0 ).toUpperCase() + str.slice( 1 );

/**
 * Converts a size token name to a CSS design token property reference (with
 * fallback).
 *
 * @param property The CSS property name.
 * @param value    The size token name.
 * @return A CSS value string with variable references.
 */
const getSpacingValue = ( property: string, value: string ): string =>
	`var(--wpds-dimension-${ property }-${ value }, var(--wpds-dimension-${ property }-${ value }))`;

/**
 * Generates CSS styles for properties with optionally directional values,
 * normalizing single values and objects with directional keys for logical
 * properties.
 *
 * @param property The CSS property name from BoxProps.
 * @param value    The property value (single or object with directional keys).
 * @return A CSSProperties object with the computed styles.
 */
const getDimensionVariantStyles = < T extends keyof BoxProps >(
	property: T,
	value: NonNullable< BoxProps[ T ] >
): React.CSSProperties =>
	typeof value !== 'object'
		? { [ property ]: getSpacingValue( property, value ) }
		: Object.keys( value ).reduce(
				( result, key ) => ( {
					...result,
					[ property + capitalize( key ) ]: getSpacingValue(
						property,
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
	const style: React.CSSProperties = {};

	if ( backgroundColor ) {
		style.backgroundColor = `var(--wpds-color-bg-${ target }-${ backgroundColor }, var(--wpds-color-bg-surface-${ backgroundColor }))`;
	}

	if ( color ) {
		style.color = `var(--wpds-color-fg-${ target }-${ color }, var(--wpds-color-fg-content-${ color }))`;
	}

	if ( padding ) {
		Object.assign( style, getDimensionVariantStyles( 'padding', padding ) );
	}

	if ( borderRadius ) {
		style.borderRadius = `var(--wpds-border-radius-${ target }-${ borderRadius }, var(--wpds-border-radius-${ borderRadius }))`;
	}

	if ( borderWidth ) {
		style.borderWidth = `var(--wpds-border-width-${ target }-${ borderWidth }, var(--wpds-border-width-${ borderWidth }))`;
		style.borderStyle = 'solid';
	}

	if ( borderColor ) {
		style.borderColor = `var(--wpds-color-stroke-${ target }-${ borderColor }, var(--wpds-color-stroke-surface-${ borderColor }))`;
	}

	const element = useRender( {
		render,
		ref,
		props: mergeProps< 'div' >( props, { style } ),
	} );

	return element;
} );
