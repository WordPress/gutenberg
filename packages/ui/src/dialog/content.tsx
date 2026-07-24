import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { useOverlayScrollStateAttributes } from '../utils/use-overlay-scroll-state-attributes';
import focusStyles from '../utils/css/focus.module.css';
import styles from './style.module.css';
import type { ContentProps } from './types';

/**
 * Renders the scrollable body of the dialog, sitting between `Dialog.Header`
 * and `Dialog.Footer` as a flex sibling.
 *
 * **Required for scrolling** — `Dialog.Content` is the element that owns
 * the popup's overflow. Without it, body content that exceeds the popup's
 * max height clips instead of scrolling. Render it once per popup and wrap
 * any freeform body content in it.
 *
 * Placing `Dialog.Header` or `Dialog.Footer` *inside* `Dialog.Content`
 * makes them scroll with the body (the "non-sticky" opt-out) rather than
 * staying pinned to the popup's edges.
 */
const Content = forwardRef< HTMLDivElement, ContentProps >(
	function DialogContent( { className, render, onScroll, ...props }, ref ) {
		const { ref: scrollStateRef, onScroll: scrollStateOnScroll } =
			useOverlayScrollStateAttributes< HTMLDivElement >( onScroll );
		const mergedRef = useMergeRefs( [ ref, scrollStateRef ] );

		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref: mergedRef,
			props: mergeProps< 'div' >( props, {
				className: clsx(
					styles.content,
					focusStyles[ 'outset-ring--focus-visible' ],
					className
				),
				onScroll: scrollStateOnScroll,
			} ),
		} );

		return element;
	}
);

export { Content };
