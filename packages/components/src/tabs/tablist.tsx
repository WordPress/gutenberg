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
import type { ElementOffsetRect } from '../utils/element-rect';
import { useTrackElementOffsetRect } from '../utils/element-rect';
import { useTrackOverflow } from './use-track-overflow';
import { useAnimatedOffsetRect } from '../utils/hooks/use-animated-offset-rect';

const DEFAULT_SCROLL_MARGIN = 24;

/**
 * Scrolls a given parent element so that a given rect is visible.
 *
 * The scroll is updated initially and whenever the rect changes.
 */
function useScrollRectIntoView(
	parent: HTMLElement | undefined,
	rect: ElementOffsetRect,
	{ margin = DEFAULT_SCROLL_MARGIN } = {}
) {
	useLayoutEffect( () => {
		if ( ! parent || ! rect ) {
			return;
		}

		const { scrollLeft: parentScroll } = parent;
		const parentWidth = parent.getBoundingClientRect().width;
		const { left: childLeft, width: childWidth } = rect;

		const parentRightEdge = parentScroll + parentWidth;
		const childRightEdge = childLeft + childWidth;
		const rightOverflow = childRightEdge + margin - parentRightEdge;
		const leftOverflow = parentScroll - ( childLeft - margin );
		if ( leftOverflow > 0 ) {
			parent.scrollLeft = parentScroll - leftOverflow;
		} else if ( rightOverflow > 0 ) {
			parent.scrollLeft = parentScroll + rightOverflow;
		}
	}, [ margin, parent, rect ] );
}

export const TabList = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TabListProps, 'div', false >
>( function TabList( { children, ...otherProps }, ref ) {
	const { store } = useTabsContext() ?? {};

	const selectedId = useStoreState( store, 'selectedId' );
	const activeId = useStoreState( store, 'activeId' );
	const selectOnMove = useStoreState( store, 'selectOnMove' );
	const items = useStoreState( store, 'items' );
	const [ parent, setParent ] = useState< HTMLElement >();
	const refs = useMergeRefs( [ ref, setParent ] );
	const selectedRect = useTrackElementOffsetRect(
		store?.item( selectedId )?.element
	);

	// Track overflow to show scroll hints.
	const overflow = useTrackOverflow( parent, {
		first: items?.at( 0 )?.element,
		last: items?.at( -1 )?.element,
	} );

	// Size, position, and animate the indicator.
	useAnimatedOffsetRect( parent, selectedRect, {
		prefix: 'selected',
		dataAttribute: 'indicator-animated',
		transitionEndFilter: ( event ) => event.pseudoElement === '::before',
	} );

	// Make sure selected tab is scrolled into view.
	useScrollRectIntoView( parent, selectedRect );

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
			render={ <TabListWrapper /> }
			onBlur={ onBlur }
			tabIndex={ -1 }
			data-select-on-move={ selectOnMove ? 'true' : 'false' }
			{ ...otherProps }
			className={ clsx(
				overflow.first && 'is-overflowing-first',
				overflow.last && 'is-overflowing-last',
				otherProps.className
			) }
		>
			{ children }
		</Ariakit.TabList>
	);
} );
