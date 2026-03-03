import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { VisuallyHiddenProps } from './types';
import styles from './style.module.css';

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Useful when providing context that's only meaningful to assistive technology.
 */
export const VisuallyHidden = forwardRef< HTMLDivElement, VisuallyHiddenProps >(
	function VisuallyHidden( { render, ...restProps }, ref ) {
		const element = useRender( {
			render,
			ref,
			props: mergeProps< 'div' >(
				{ className: styles[ 'visually-hidden' ] },
				restProps
			),
		} );

		return element;
	}
);
