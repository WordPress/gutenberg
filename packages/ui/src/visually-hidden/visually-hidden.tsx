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
 * When composing with another component that uses the `render` prop
 * pattern, there are two directions — and they produce different results.
 *
 * Most of the time you'll want `VisuallyHidden` as the **host** (outer
 * component) and pass the other component via `render`. This keeps the
 * other component's HTML element and semantics intact, while
 * `VisuallyHidden` only adds its hiding styles:
 *
 * ```jsx
 * // OtherComponent keeps its semantic element (e.g. <h2>).
 * <VisuallyHidden render={ <OtherComponent /> }>
 *   Accessible text
 * </VisuallyHidden>
 * ```
 *
 * The opposite direction is also possible, but be aware that it replaces
 * the other component's element with VisuallyHidden's default `<div>`:
 *
 * ```jsx
 * // OtherComponent's element becomes a <div>.
 * <OtherComponent render={ <VisuallyHidden /> }>
 *   Accessible text
 * </OtherComponent>
 * ```
 *
 * Choose based on what you need: if the other component's semantic
 * element matters (e.g. `<label>`, `<legend>`, `<h2>`), keep
 * `VisuallyHidden` as the host so the element is preserved.
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
