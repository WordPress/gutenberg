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
import { type StackProps } from './types';
import styles from './style.module.css';

/**
 * A flexible layout component using CSS Flexbox for consistent spacing and alignment.
 * Built on design tokens for predictable spacing values.
 */
export const Stack = forwardRef< HTMLDivElement, StackProps >( function Stack(
	{ direction, gap, align, justify, wrap, render, ...props },
	ref
) {
	const className = clsx( props.className, styles.stack );

	const style: React.CSSProperties = {
		gap: gap && `var(--wpds-dimension-gap-${ gap })`,
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
