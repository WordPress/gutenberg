import { useRender, mergeProps } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { GapSize } from '@wordpress/theme';
import { type StackProps } from './types';
import styles from './style.module.css';

// Static map so that the build-time token fallback plugin can inject fallback
// values into each `var()` call.
const gapTokens: Record< GapSize, string > = {
	xs: 'var(--wpds-dimension-gap-xs)',
	sm: 'var(--wpds-dimension-gap-sm)',
	md: 'var(--wpds-dimension-gap-md)',
	lg: 'var(--wpds-dimension-gap-lg)',
	xl: 'var(--wpds-dimension-gap-xl)',
	'2xl': 'var(--wpds-dimension-gap-2xl)',
	'3xl': 'var(--wpds-dimension-gap-3xl)',
};

/**
 * A flexible layout component using CSS Flexbox for consistent spacing and alignment.
 * Built on design tokens for predictable spacing values.
 */
export const Stack = forwardRef< HTMLDivElement, StackProps >( function Stack(
	{ direction, gap, align, justify, wrap, render, ...props },
	ref
) {
	const style: React.CSSProperties = {
		gap: gap && gapTokens[ gap ],
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
