import { mergeProps, useRender } from '@base-ui/react';
import { forwardRef } from '@wordpress/element';
import type { VisuallyHiddenProps } from './types';
import styles from './style.module.css';

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Useful when providing context that's only meaningful to assistive technology.
 *
 * Renders a `<div>` by default. Use the `render` prop to swap the
 * underlying element while preserving the visually-hidden behavior.
 *
 * ## Composing with other components
 *
 * When composing with a component that has its own semantic element,
 * always make `VisuallyHidden` the **host** (outer component) and pass
 * the other component via `render`. This way the other component keeps
 * its HTML element and semantics, and `VisuallyHidden` only contributes
 * its hiding styles:
 *
 * ```jsx
 * // Correct — OtherComponent keeps its semantic element (e.g. <h2>).
 * <VisuallyHidden render={ <OtherComponent /> }>
 *   Accessible text
 * </VisuallyHidden>
 * ```
 *
 * Avoid the opposite direction — it replaces the other component's
 * element with VisuallyHidden's default `<div>`, losing semantics:
 *
 * ```jsx
 * // Avoid — OtherComponent's element becomes a <div>.
 * <OtherComponent render={ <VisuallyHidden /> }>
 *   Accessible text
 * </OtherComponent>
 * ```
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
