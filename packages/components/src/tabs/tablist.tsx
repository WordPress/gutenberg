/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import { useStoreState } from '@ariakit/react';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import { forwardRef, useEffect, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { TabListProps } from './types';
import { useTabsContext } from './context';
import { TabListWrapper } from './styles';
import type { WordPressComponentProps } from '../context';
import clsx from 'clsx';
import { useTrackElementOffsetRect } from '../utils/element-rect';
import { useOnValueUpdate } from '../utils/hooks/use-on-value-update';
import { useTrackOverflow } from './use-track-overflow';

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const context = useTabsContext();

	const selectedId = useStoreState( context?.store, 'selectedId' );
	const selectedElement = context?.store.item( selectedId )?.element;
	const indicatorPosition = useTrackElementOffsetRect( selectedElement );
	const items = useStoreState( context?.store, 'items' );
	const [ parent, setParent ] = useState< HTMLElement | null >();
	const overflow = useTrackOverflow( parent, {
		first: items?.at( 0 )?.element,
		last: items?.at( -1 )?.element,
	} );
	const refs = useMergeRefs( [ ref, setParent ] );

	const [ animationEnabled, setAnimationEnabled ] = useState( false );
	useOnValueUpdate( selectedId, ( { previousValue } ) => {
		if ( previousValue ) {
			setAnimationEnabled( true );
		}
	} );

	// Make sure active tab is scrolled into view.
	useEffect( () => {
		if ( ! parent || ! indicatorPosition ) {
			return;
		}

		const SCROLL_MARGIN = 24;

		function scrollTo( left: number ) {
			if ( parent ) {
				const originalOverflowX = parent.style.overflowX;
				parent.style.overflowX = 'hidden';
				parent.scroll( { left } );
				parent.style.overflowX = originalOverflowX;
			}
		}

		const { scrollLeft: parentScroll } = parent;
		const parentWidth = parent.getBoundingClientRect().width;
		const { left: childLeft, width: childWidth } = indicatorPosition;

		const parentRightEdge = parentScroll + parentWidth;
		const childRightEdge = childLeft + childWidth;
		const rightOverflow = childRightEdge + SCROLL_MARGIN - parentRightEdge;
		if ( rightOverflow > 0 ) {
			return scrollTo( parentScroll + rightOverflow );
		}

		const leftOverflow = parentScroll - ( childLeft - SCROLL_MARGIN );
		if ( leftOverflow > 0 ) {
			return scrollTo( parentScroll - leftOverflow );
		}
	}, [ indicatorPosition, parent ] );

	const activeId = useStoreState( context?.store, 'activeId' );
	const selectOnMove = useStoreState( context?.store, 'selectOnMove' );

	if ( ! context?.store ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}

	const { store } = context;
	const { setActiveId } = store;

	const onBlur = () => {
		if ( ! selectOnMove ) {
			return;
		}

		// When automatic tab selection is on, make sure that the active tab is up
		// to date with the selected tab when leaving the tablist. This makes sure
		// that the selected tab will receive keyboard focus when tabbing back into
		// the tablist.
		if ( selectedId !== activeId ) {
			setActiveId( selectedId );
		}
	};

	return (
		<Ariakit.TabList
			ref={ refs }
			store={ store }
			render={
				<TabListWrapper
					onTransitionEnd={ ( event ) => {
						if ( event.pseudoElement === '::before' ) {
							setAnimationEnabled( false );
						}
					} }
				/>
			}
			onBlur={ onBlur }
			tabIndex={ -1 }
			{ ...otherProps }
			style={ {
				'--indicator-top': indicatorPosition.top,
				'--indicator-right': indicatorPosition.right,
				'--indicator-left': indicatorPosition.left,
				'--indicator-width': indicatorPosition.width,
				'--indicator-height': indicatorPosition.height,
				...otherProps.style,
			} }
			className={ clsx(
				overflow.first && 'is-overflowing-first',
				overflow.last && 'is-overflowing-last',
				animationEnabled && 'is-animation-enabled',
				otherProps.className
			) }
		>
			{ children }
		</Ariakit.TabList>
	);
} );
