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
 * Internally, the visible scroll container wraps Base UI's `_Drawer.Content`
 * marker rather than being it. Base UI excludes mouse-drag swipe-dismiss
 * over `[data-drawer-content]` to preserve text selection inside the
 * body; keeping that marker tightly scoped to the children means the
 * scroll container's padding gutter falls outside it and remains
 * mouse-draggable for swipe-dismiss in the gutter region.
 */
const Content = forwardRef< HTMLDivElement, ContentProps >(
	function DrawerContent( { className, children, onScroll, ...props }, ref ) {
		const { ref: scrollStateRef, onScroll: scrollStateOnScroll } =
			useOverlayScrollStateAttributes< HTMLDivElement >( onScroll );
		const mergedRef = useMergeRefs( [ ref, scrollStateRef ] );

		return (
			<div
				ref={ mergedRef }
				className={ clsx(
					styles.content,
					focusStyles[ 'outset-ring--focus-visible' ],
					className
				) }
				onScroll={ scrollStateOnScroll }
				{ ...props }
			>
				<_Drawer.Content>{ children }</_Drawer.Content>
			</div>
		);
	}
);

export { Content };
