import { mergeProps, useRender } from '@base-ui/react';
import { Drawer as _Drawer } from '@base-ui/react/drawer';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { useOverlayScrollStateAttributes } from '../utils/use-overlay-scroll-state-attributes';
import focusStyles from '../utils/css/focus.module.css';
import styles from './style.module.css';
import type { ContentProps } from './types';

/**
 * Renders the scrollable body of the drawer, sitting between `Drawer.Header`
 * and `Drawer.Footer` as a flex sibling.
 *
 * **Required for scrolling** — `Drawer.Content` is the element that owns
 * the popup's overflow. Without it, body content that exceeds the popup's
 * available space clips instead of scrolling, and swipe-to-dismiss on
 * scrollable vertical drawers won't gate correctly at the scroll edge.
 * Render it once per popup and wrap any freeform body content in it.
 *
 * Placing `Drawer.Header` or `Drawer.Footer` *inside* `Drawer.Content`
 * makes them scroll with the body (the "non-sticky" opt-out) rather than
 * staying pinned to the popup's edges.
 *
 * Mouse-drag swipe-to-dismiss is preserved in the popup-edge padding
 * gutter and on the chrome regions; mouse drag over the body itself
 * does not dismiss the drawer, so text selection inside the body keeps
 * working normally. Touch swipe-to-dismiss engages from anywhere in
 * the popup (gated by the scroll edge on vertical drawers).
 */
const Content = forwardRef< HTMLDivElement, ContentProps >(
	function DrawerContent(
		{ className, render, children, onScroll, ...props },
		ref
	) {
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
				// `_Drawer.Content` carries the `[data-drawer-content]`
				// marker that Base UI's swipe-dismiss logic uses to skip
				// mouse-drag swipes started inside the body, preserving
				// text selection. It must sit *inside* the scroll
				// container so the popup's edge padding gutter falls
				// outside the marker and stays mouse-draggable.
				children: <_Drawer.Content>{ children }</_Drawer.Content>,
			} ),
		} );

		return element;
	}
);

export { Content };
