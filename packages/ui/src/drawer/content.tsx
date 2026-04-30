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
 * available space clips instead of scrolling, and Base UI's
 * swipe-dismiss-on-scroll-edge logic will not engage on up/down drawers.
 * Render it once per popup and wrap any freeform body content in it.
 *
 * Placing `Drawer.Header` or `Drawer.Footer` *inside* `Drawer.Content`
 * makes them scroll with the body (the "non-sticky" opt-out) rather than
 * staying pinned to the popup's edges.
 *
 * Renders Base UI's `_Drawer.Content` so swipe-dismiss wiring remains
 * wired automatically.
 */
const Content = forwardRef< HTMLDivElement, ContentProps >(
	function DrawerContent( { className, children, onScroll, ...props }, ref ) {
		const { ref: scrollStateRef, onScroll: scrollStateOnScroll } =
			useOverlayScrollStateAttributes< HTMLDivElement >( onScroll );
		const mergedRef = useMergeRefs( [ ref, scrollStateRef ] );

		return (
			<_Drawer.Content
				ref={ mergedRef }
				className={ clsx(
					styles.content,
					focusStyles[ 'outset-ring--focus-visible' ],
					className
				) }
				onScroll={ scrollStateOnScroll }
				{ ...props }
			>
				{ children }
			</_Drawer.Content>
		);
	}
);

export { Content };
