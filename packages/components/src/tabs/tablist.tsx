/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import { useStoreState } from '@ariakit/react';

/**
 * WordPress dependencies
 */
import warning from '@wordpress/warning';
import { forwardRef, useLayoutEffect, useState } from '@wordpress/element';
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

const SCROLL_MARGIN = 24;

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const { store } = useTabsContext() ?? {};

	const selectedId = useStoreState( store, 'selectedId' );
	const activeId = useStoreState( store, 'activeId' );
	const selectOnMove = useStoreState( store, 'selectOnMove' );
	const items = useStoreState( store, 'items' );
	const [ parent, setParent ] = useState< HTMLElement | null >();
	const refs = useMergeRefs( [ ref, setParent ] );
	const overflow = useTrackOverflow( parent, {
		first: items?.at( 0 )?.element,
		last: items?.at( -1 )?.element,
	} );

	const selectedTabPosition = useTrackElementOffsetRect(
		store?.item( selectedId )?.element
	);

	const [ animationEnabled, setAnimationEnabled ] = useState( false );
	useOnValueUpdate( selectedId, ( { previousValue } ) => {
		if ( previousValue ) {
			setAnimationEnabled( true );
		}
	} );

	// Make sure selected tab is scrolled into view.
	useLayoutEffect( () => {
		if ( ! parent || ! selectedTabPosition ) {
			return;
		}

		const { scrollLeft: parentScroll } = parent;
		const parentWidth = parent.getBoundingClientRect().width;
		const { left: childLeft, width: childWidth } = selectedTabPosition;

		const parentRightEdge = parentScroll + parentWidth;
		const childRightEdge = childLeft + childWidth;
		const rightOverflow = childRightEdge + SCROLL_MARGIN - parentRightEdge;
		const leftOverflow = parentScroll - ( childLeft - SCROLL_MARGIN );
		if ( leftOverflow > 0 ) {
			parent.scrollLeft = parentScroll - leftOverflow;
		} else if ( rightOverflow > 0 ) {
			parent.scrollLeft = parentScroll + rightOverflow;
		}
	}, [ parent, selectedTabPosition ] );

	const onBlur = () => {
		if ( ! selectOnMove ) {
			return;
		}

		// When automatic tab selection is on, make sure that the active tab is up
		// to date with the selected tab when leaving the tablist. This makes sure
		// that the selected tab will receive keyboard focus when tabbing back into
		// the tablist.
		if ( selectedId !== activeId ) {
			store?.setActiveId( selectedId );
		}
	};

	if ( ! store ) {
		warning( '`Tabs.TabList` must be wrapped in a `Tabs` component.' );
		return null;
	}

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
				'--indicator-top': selectedTabPosition.top,
				'--indicator-right': selectedTabPosition.right,
				'--indicator-left': selectedTabPosition.left,
				'--indicator-width': selectedTabPosition.width,
				'--indicator-height': selectedTabPosition.height,
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
