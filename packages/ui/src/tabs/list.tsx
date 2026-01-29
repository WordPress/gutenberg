import {
	cloneElement,
	forwardRef,
	isValidElement,
	useEffect,
	useState,
} from '@wordpress/element';
import clsx from 'clsx';
import { Tabs as _Tabs } from '@base-ui/react/tabs';
import { useMergeRefs } from '@wordpress/compose';
import styles from './style.module.css';
import type { TabListProps } from './types';

const DEFAULT_SCROLL_MARGIN = 0;

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
			density = 'default',
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
		} >( {
			first: false,
			last: false,
		} );

		// Check if list is overflowing when it scrolls or resizes.
		useEffect( () => {
			if ( ! listEl ) {
				return;
			}

			const measureOverflow = () => {
				const { scrollWidth, clientWidth, scrollLeft } = listEl;

				setOverflow( {
					first: scrollLeft > DEFAULT_SCROLL_MARGIN,
					last:
						scrollLeft + clientWidth <
						scrollWidth - DEFAULT_SCROLL_MARGIN,
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
					styles[ `has-${ density }-density` ],
					className
				) }
				render={ ( props, state ) => {
					// Fallback to -1 to prevent browsers from making the tablist
					// tabbable when it is a scrolling container.
					const newProps = {
						...props,
						tabIndex: props.tabIndex ?? -1,
					};

					if ( isValidElement( render ) ) {
						return cloneElement( render, newProps );
					} else if ( typeof render === 'function' ) {
						return render( newProps, state );
					}
					return <div { ...newProps } />;
				} }
				{ ...otherProps }
			>
				{ children }
				<_Tabs.Indicator className={ styles.indicator } />
			</_Tabs.List>
		);
	}
);
