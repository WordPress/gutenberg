/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { renderElement } from '../utils/element';
import { type StackProps, type SizeToken } from './types';
import styles from './style.module.css';

/**
 * Set of token names for gap spacing.
 */
const TOKEN_NAMES = new Set< SizeToken >( [
	'2xs',
	'xs',
	'sm',
	'md',
	'lg',
	'xl',
] );

/**
 * Normalizes the gap value. When given a positive number, it will be converted
 * to a CSS calculation. When given a string, it will be returned as is.
 *
 * @param gap The gap value to normalize.
 *
 * @return The normalized gap value.
 */
export function getNormalizedGap(
	gap: number | SizeToken | React.CSSProperties[ 'gap' ]
): string {
	if ( typeof gap === 'number' ) {
		return `calc( ${ gap } * var( --wpds-dimension-base ) )`;
	}

	if ( TOKEN_NAMES.has( gap as SizeToken ) ) {
		return `var(--wpds-dimension-gap-${ gap })`;
	}

	return String( gap );
}

/**
 * A flexible layout component using CSS Flexbox for consistent spacing and alignment.
 * Built on design tokens for predictable spacing values.
 */
export const Stack = forwardRef< HTMLDivElement, StackProps >( function Stack(
	{ direction, gap = 0, align, justify, wrap, render, ...props },
	ref
) {
	const className = clsx( props.className, styles.stack );

	const style: React.CSSProperties = {
		gap: getNormalizedGap( gap ),
		alignItems: align,
		justifyContent: justify,
		flexDirection: direction,
		flexWrap: wrap,
		...props.style,
	};

	return renderElement< 'div' >( {
		render,
		ref,
		props: { ...props, style, className },
	} );
} );
