import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
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
	const style: React.CSSProperties = {
		gap: gap && `var(--wpds-dimension-gap-${ gap })`,
		alignItems: align,
		justifyContent: justify,
		flexDirection: direction,
		flexWrap: wrap,
	};

	const element = useRender( {
		render,
		ref,
		props: mergeProps< 'div' >( props, { style, className: styles.stack } ),
	} );

	return element;
} );
