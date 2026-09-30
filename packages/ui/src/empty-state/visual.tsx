import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { EmptyStateVisualProps } from './types';
import styles from './style.module.css';

/**
 * A container for visual content in an empty state (e.g., icons, illustrations).
 * Provides appropriate spacing and alignment for visual elements.
 */
export const Visual = forwardRef< HTMLDivElement, EmptyStateVisualProps >(
	function EmptyStateVisual( { render, ...props }, ref ) {
		const className = clsx( styles.visual );

		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref,
			props: mergeProps< 'div' >( { className }, props ),
		} );

		return element;
	}
);
