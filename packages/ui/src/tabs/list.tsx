import { forwardRef, useEffect, useState } from '@wordpress/element';
import clsx from 'clsx';
import { Tabs as _Tabs } from '@base-ui/react/tabs';
import { useMergeRefs } from '@wordpress/compose';
import styles from './style.module.css';
import type { TabListProps } from './types';

// Account for sub-pixel rounding errors.
const SCROLL_EPSILON = 1;

/**
 * Groups the individual tab buttons.
 *
 * `Tabs` is a collection of React components that combine to render
 * an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
 */
export const List = forwardRef< HTMLDivElement, TabListProps >(
	function TabList(
		{
			children,
			variant = 'default',
			className,
			activateOnFocus,
			render,
			...otherProps
		},
		forwardedRef
	) {
		const [ listEl, setListEl ] = useState< HTMLDivElement | null >( null );
		const [ overflow, setOverflow ] = useState< {
			first: boolean;
			last: boolean;
			isScrolling: boolean;
		} >( {
			first: false,
			last: false,
			isScrolling: false,
		} );

		// Check if list is overflowing when it scrolls or resizes.
		useEffect( () => {
			if ( ! listEl ) {
				return;
			}

			const measureOverflow = () => {
				const { scrollWidth, clientWidth, scrollLeft } = listEl;
				const maxScroll = Math.max( scrollWidth - clientWidth, 0 );
				const direction =
					listEl.dir ||
					( typeof window !== 'undefined'
						? window.getComputedStyle( listEl ).direction
						: 'ltr' );

				const scrollFromStart =
					direction === 'rtl' && scrollLeft < 0
						? // In RTL layouts, scrollLeft is typically 0 at the visual "start"
						  // (right edge) and becomes negative toward the "end" (left edge).
						  // Normalize value for correct first/last detection logic.
						  -scrollLeft
						: scrollLeft;

				// Use SCROLL_EPSILON to handle subpixel rendering differences.
				setOverflow( {
					first: scrollFromStart > SCROLL_EPSILON,
					last: scrollFromStart < maxScroll - SCROLL_EPSILON,
					isScrolling: scrollWidth > clientWidth,
				} );
			};

			const resizeObserver = new ResizeObserver( measureOverflow );
			resizeObserver.observe( listEl );

			let scrollTick = false;
			const throttleMeasureOverflowOnScroll = () => {
				if ( ! scrollTick ) {
					requestAnimationFrame( () => {
						measureOverflow();
						scrollTick = false;
					} );
					scrollTick = true;
				}
			};
			listEl.addEventListener(
				'scroll',
				throttleMeasureOverflowOnScroll,
				{ passive: true }
			);

			// Initial check.
			measureOverflow();

			return () => {
				listEl.removeEventListener(
					'scroll',
					throttleMeasureOverflowOnScroll
				);
				resizeObserver.disconnect();
			};
		}, [ listEl ] );

		const mergedListRef = useMergeRefs( [
			forwardedRef,
			( el: HTMLDivElement | null ) => setListEl( el ),
		] );

		return (
			<_Tabs.List
				ref={ mergedListRef }
				activateOnFocus={ activateOnFocus }
				data-select-on-move={ activateOnFocus ? 'true' : 'false' }
				className={ clsx(
					styles.tablist,
					overflow.first && styles[ 'is-overflowing-first' ],
					overflow.last && styles[ 'is-overflowing-last' ],
					styles[ `is-${ variant }-variant` ],
					className
				) }
				{ ...otherProps }
				tabIndex={
					otherProps.tabIndex ??
					( overflow.isScrolling ? -1 : undefined )
				}
			>
				{ children }
				<_Tabs.Indicator className={ styles.indicator } />
			</_Tabs.List>
		);
	}
);
